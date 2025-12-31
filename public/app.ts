// app.ts
import { graphStore } from "@/lib/graph/store/store"
import { initEngine } from "@/lib/graph/engine/engine"

const root = document.getElementById("app")!
initEngine(root)

// initial data
graphStore.getState().setData({
  nodes: [
    { node_id: "1", x: 0, y: 0 },
  ],
})

// click to add node
root.addEventListener("mousedown", (e) => {
  const rect = root.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  graphStore.getState().addNode(x, y)
})
