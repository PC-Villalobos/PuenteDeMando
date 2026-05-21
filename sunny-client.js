/*
 * SunnyBridge client for Puente/Cowork.
 *
 * Talks to the local Sunny Core Hub and accepts closure objects in the
 * Argos-style shape: log/shadow/glitch/state/captain/handoff.
 */
(function attachSunnyBridge(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SunnyBridge = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function buildSunnyBridge() {
  const DEFAULT_HUB_URL = "http://127.0.0.1:3333";
  const REQUIRED_HANDOFF_FIELDS = ["contexto", "decision", "continuidad", "session_ref"];
  const VALID_AI_STATUSES = ["idle", "working", "blocked", "waiting_captain"];

  function trim(value) {
    return String(value || "").trim();
  }

  function normalizeHubUrl(url) {
    return trim(url || DEFAULT_HUB_URL).replace(/\/+$/, "");
  }

  function pickFetch(fetchImpl) {
    const candidate = fetchImpl || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
    if (!candidate) {
      throw new Error("SunnyBridge requires fetch. Use Node 18+ or pass fetchImpl.");
    }
    return candidate;
  }

  function normalizeHandoff(input) {
    const handoff = input || {};
    return {
      contexto: trim(handoff.contexto || handoff.context),
      decision: trim(handoff.decision),
      continuidad: trim(handoff.continuidad || handoff.continuity),
      session_ref: trim(handoff.session_ref || handoff.sessionRef),
    };
  }

  function assertHandoff(handoff) {
    const missing = REQUIRED_HANDOFF_FIELDS.filter((field) => !trim(handoff[field]));
    if (missing.length) {
      throw new Error(`SunnyBridge closure rejected: missing handoff fields: ${missing.join(", ")}`);
    }
  }

  function normalizeClosureSections(input) {
    const sections = input.sections || input;
    const handoff = normalizeHandoff(sections.handoff || input.handoff);
    assertHandoff(handoff);

    const state = sections.state || {};
    const status = VALID_AI_STATUSES.includes(trim(state.status)) ? trim(state.status) : "idle";

    return {
      log: trim(sections.log),
      shadow: trim(sections.shadow),
      glitch: trim(sections.glitch),
      state: {
        status,
        summary: trim(state.summary),
        handoff_to: state.handoff_to === null || state.handoffTo === null
          ? null
          : trim(state.handoff_to || state.handoffTo),
        next_step: trim(state.next_step || state.nextStep),
      },
      captain: trim(sections.captain),
      handoff,
    };
  }

  function normalizeStartPayload(packetIdOrPayload, actor, summary) {
    if (typeof packetIdOrPayload === "object" && packetIdOrPayload !== null) {
      return { ...packetIdOrPayload };
    }

    return {
      packetId: packetIdOrPayload,
      actor,
      summary,
      subject: summary,
      objective: summary,
    };
  }

  function normalizeClosePayload(packetId, actorOrPayload, closureData) {
    const input = typeof actorOrPayload === "object" && actorOrPayload !== null
      ? actorOrPayload
      : { ...(closureData || {}), actor: actorOrPayload };

    const actor = trim(input.actor || input.agent);
    const trigger = trim(input.trigger) || "task_completed";
    const sections = normalizeClosureSections(input.sections ? input : input.sections || input);
    const summary = trim(input.summary || sections.captain || sections.log);

    return {
      actor,
      role: trim(input.role),
      status: trim(input.status) || "done",
      trigger,
      summary,
      captain: sections.captain,
      handoff: sections.handoff,
      closure: {
        agent: actor,
        interface: trim(input.interface) || "puente-cowork",
        timestamp: input.timestamp || new Date().toISOString(),
        packet_id: packetId,
        trigger,
        mark_packet_done: input.mark_packet_done !== false && input.markPacketDone !== false,
        sections,
      },
      projectIds: input.projectIds || ["thousand_sunny_operativo"],
      tags: input.tags || ["sunny-core", "puente", "cowork"],
      links: input.links || [],
      source: input.source || "sunny-client",
      route: input.route || "puentedemando",
    };
  }

  class SunnyBridge {
    constructor(options = {}) {
      this.hubUrl = normalizeHubUrl(options.hubUrl || options.baseUrl);
      this.fetchImpl = pickFetch(options.fetchImpl);
    }

    async request(path, options = {}) {
      const response = await this.fetchImpl(`${this.hubUrl}${path}`, {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok || (data && data.ok === false)) {
        const message = data?.error || data?.message || response.statusText || "Sunny Core request failed";
        const error = new Error(message);
        error.response = data;
        error.status = response.status;
        throw error;
      }

      return data;
    }

    async getCoreState(options = {}) {
      const query = options.schemas ? "?schemas=1" : "";
      return this.request(`/api/core${query}`);
    }

    async startMission(packetIdOrPayload, actor, summary) {
      const payload = normalizeStartPayload(packetIdOrPayload, actor, summary);
      return this.request("/api/missions/start", {
        method: "POST",
        body: payload,
      });
    }

    async closeMission(packetId, actorOrPayload, closureData) {
      const payload = normalizeClosePayload(packetId, actorOrPayload, closureData);
      return this.request(`/api/missions/${encodeURIComponent(packetId)}/close`, {
        method: "POST",
        body: payload,
      });
    }

    static getCoreState(options = {}) {
      return new SunnyBridge(options).getCoreState(options);
    }

    static startMission(packetIdOrPayload, actor, summary, options = {}) {
      return new SunnyBridge(options).startMission(packetIdOrPayload, actor, summary);
    }

    static closeMission(packetId, actorOrPayload, closureData, options = {}) {
      return new SunnyBridge(options).closeMission(packetId, actorOrPayload, closureData);
    }
  }

  SunnyBridge.DEFAULT_HUB_URL = DEFAULT_HUB_URL;
  return SunnyBridge;
});
