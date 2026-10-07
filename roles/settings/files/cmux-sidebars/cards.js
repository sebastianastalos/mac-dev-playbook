// Card-per-workspace sidebar, colours matched to the Claude Code status line.
const C = {
  orange: "#d97757", green: "#7ec699", amber: "#e5b567", red: "#ff6b6b",
  text: "#d0d0d0", dim: "#8a8a8a", idle: "#4a4a4a",
  card: "#ffffff0d", cardOn: "#ffffff21", edge: "#ffffff14", edgeOn: "#ffffff38", rail: "#e6e6e6",
};

function state(w) {
  const agent = (w.agents ?? [])[0];
  if (agent?.status === "needs_input") return { color: C.amber, label: "needs you" };
  if (agent?.status === "working") return { color: C.orange, label: "working" };
  if (w.unread > 0) return { color: C.green, label: "new" };
  return { color: C.idle, label: "" };
}

const secs = (t) => (t > 1e12 ? t / 1000 : t);

function ago(t) {
  const now = secs(data.clock()?.epoch ?? 0);
  const m = Math.max(0, Math.floor((now - secs(t)) / 60));
  if (m < 1) return "<1m";
  if (m < 60) return `${m}m`;
  return m < 1440 ? `${Math.floor(m / 60)}h${m % 60 ? (m % 60) + "m" : ""}` : `${Math.floor(m / 1440)}d`;
}

function activity(w) {
  const a = (w.agents ?? [])[0];
  if (!a) return "";
  const who = a.name || a.kind;
  const since = a.sinceEpoch ?? a.lastActivityAt;
  if (a.status === "working") return `${who} · working ${ago(since)}`;
  if (a.status === "needs_input") return `${who} · waiting on you ${ago(since)}`;
  return `${who} · ${a.status} · ${ago(a.lastActivityAt)} ago`;
}

function counts() {
  const c = { working: 0, needs: 0, idle: 0 };
  for (const w of data.workspaces() ?? []) {
    const st = ((w.agents ?? [])[0] ?? {}).status;
    if (st === "working") c.working++;
    else if (st === "needs_input") c.needs++;
    else c.idle++;
  }
  return c;
}

function subagents(w) {
  const kids = ((w.agents ?? [])[0] ?? {}).children ?? [];
  return kids.map((k) => (k.running ? "◦" : "●")).join("");
}

const PR_COLORS = { open: C.green, merged: "#b48ead", closed: C.red };
const prColor = (w) => (!w.pr ? "clear" : w.pr.stale ? C.dim : PR_COLORS[w.pr.status] ?? C.dim);

const folder = (w) => (w.directory ?? "").replace(/^\/Users\/[^/]+/, "~");

function line(text, color) {
  return Text(text)
    .font("caption").color(color).lineLimit(1).truncation("middle")
    .opacity(() => (text() ? 1 : 0))
    .frame(() => ({ maxWidth: 10000, height: text() ? null : 0, alignment: "leading" }));
}

sidebar(() =>
  VStack({ spacing: 8 }, [
    HStack({ spacing: 6 }, [
      Text("Workspaces").font("headline").color(C.text),
      Spacer(),
      Text(() => (counts().needs ? `● ${counts().needs} needs you` : "")).font("caption").color(C.amber),
      Text(() => (counts().working ? `● ${counts().working} working` : "")).font("caption").color(C.orange),
      Text(() => `${counts().idle} idle`).font("caption").color(C.dim),
    ]).paddingHorizontal(4),
    Reorderable(
      {
        items: () => data.workspaces() ?? [],
        key: (w) => w.id,
        spacing: 6,
        onMove: (id, index) => cmux("workspace.reorder", { workspace_id: id, index }),
      },
      (w) =>
        HStack({ spacing: 0 }, [
          Rectangle()
            .fill(() => (w().selected ? C.rail : "clear"))
            .frame({ width: 3 }),
          VStack({ spacing: 3 }, [
            HStack({ spacing: 7 }, [
              Circle({ size: 7 }).fill(() => state(w()).color),
              Text(() => w().title)
                .font("body").weight(() => (w().selected ? "semibold" : "regular"))
                .color(() => (w().selected ? "#ffffff" : C.text))
                .lineLimit(1).truncation("tail"),
              Spacer(),
              Text(() => (w().pr ? `#${w().pr.number}` : ""))
                .font("caption").monospaced().color(() => prColor(w()))
                .paddingHorizontal(() => (w().pr ? 5 : 0))
                .borderColor(() => prColor(w())).borderWidth(() => (w().pr ? 1 : 0)).cornerRadius(4)
                .layoutPriority(2).cursor("pointer")
                .onTap(() => w().pr && openURL(w().pr.url)),
              Text(() => state(w()).label).font("caption").color(() => state(w()).color).layoutPriority(2),
            ]),
            HStack({ spacing: 6 }, [
              line(() => activity(w()), () => state(w()).label ? state(w()).color : C.dim),
              Text(() => subagents(w())).font("caption").color(C.orange).layoutPriority(2).fixedSize(),
            ]),
            line(() => folder(w()), C.dim),
          ])
            .padding(9),
        ])
          .background(() => (w().selected ? C.cardOn : C.card))
          .hoverBackground("#ffffff10")
          .borderColor(() => (w().selected ? C.edgeOn : C.edge))
          .borderWidth(1)
          .cornerRadius(9)
          .cursor("pointer")
          .onTap(() => cmux("workspace.select", { workspace_id: w().id }))
          .contextMenu([
            Button(() => (w().pinned ? "Unpin" : "Pin"), () =>
              cmux("workspace.action", { workspace_id: w().id, action: w().pinned ? "unpin" : "pin" })),
            Button("Mark read", () => cmux("workspace.action", { workspace_id: w().id, action: "mark_read" })),
            Divider(),
            Button("Close", () => cmux("workspace.close", { workspace_id: w().id })).destructive(),
          ])
    ),
  ]).padding(8),
  { surface: "glass" }
);
