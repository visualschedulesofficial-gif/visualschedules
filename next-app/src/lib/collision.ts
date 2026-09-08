import type { CollisionDetection } from "@dnd-kit/core";

// dnd-kit's built-in `pointerWithin` only registers a hit when the pointer's
// exact pixel is inside a droppable's rect. That's fine at 100% size, but the
// schedule canvas is scaled down (`zoom`) to fit A4 pages on smaller screens
// — sometimes to ~35% — which shrinks each column's real on-screen hit area
// to a sliver. Requiring pixel-exact placement against a sliver is what
// reads to users as "having to drag really far / precisely" to land a card.
//
// This wraps the same point-in-rect test with a padding margin around each
// droppable's rect, so a near-miss still counts. Sorting matches dnd-kit's
// own `pointerWithin`: by average distance from the pointer to the
// (unpadded) rect's corners, so the closest column still wins when the
// padding of two adjacent columns overlaps.
export function makePaddedPointerWithin(padding: number): CollisionDetection {
  return ({ droppableContainers, droppableRects, pointerCoordinates }) => {
    if (!pointerCoordinates) return [];

    const collisions: { id: string | number; data: { droppableContainer: (typeof droppableContainers)[number]; value: number } }[] = [];

    for (const droppableContainer of droppableContainers) {
      const { id } = droppableContainer;
      const rect = droppableRects.get(id);
      if (!rect) continue;

      const padded = {
        top: rect.top - padding,
        left: rect.left - padding,
        bottom: rect.bottom + padding,
        right: rect.right + padding,
      };

      const withinPadded =
        pointerCoordinates.y >= padded.top &&
        pointerCoordinates.y <= padded.bottom &&
        pointerCoordinates.x >= padded.left &&
        pointerCoordinates.x <= padded.right;

      if (withinPadded) {
        const corners = [
          { x: rect.left, y: rect.top },
          { x: rect.right, y: rect.top },
          { x: rect.left, y: rect.bottom },
          { x: rect.right, y: rect.bottom },
        ];
        const totalDistance = corners.reduce(
          (sum, corner) => sum + Math.hypot(pointerCoordinates.x - corner.x, pointerCoordinates.y - corner.y),
          0
        );
        collisions.push({ id, data: { droppableContainer, value: totalDistance / 4 } });
      }
    }

    return collisions.sort((a, b) => a.data.value - b.data.value);
  };
}
