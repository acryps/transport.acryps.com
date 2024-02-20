class PriorityQueue {
	constructor() {
		this.items = [];
	}

	enqueue(item, priority) {
		this.items.push({ item, priority });
		this.items.sort((a, b) => a.priority - b.priority);
	}

	dequeue() {
		return this.items.shift().item;
	}

	isEmpty() {
		return !this.items.length;
	}
}

export function route(startNode, endNode, stations, connections) {
	const distances = new Map();
	const previous = new Map();

	const priorityQueue = new PriorityQueue();

	// Initialize distances and priority queue
	for (let node of stations) {
		const distance = node == startNode ? 0 : Infinity;

		distances.set(node, distance);
		previous.set(node, null);

		priorityQueue.enqueue(node, distance);
	}

	while (!priorityQueue.isEmpty()) {
		const currentNode = priorityQueue.dequeue();

		if (currentNode == endNode) {
			// Reconstruct the path from endNode to startNode
			const path = [];
			let current = endNode;

			while (current) {
				path.unshift(current);
				current = previous.get(current);
			}

			return path;
		}

		const routes = connections.filter(connection => connection.start == currentNode);

		for (const route of routes) {
			const fullDuration = distances.get(currentNode) + route.duration;

			if (fullDuration < distances.get(route.end)) {
				distances.set(route.end, fullDuration);
				previous.set(route.end, currentNode);

				priorityQueue.enqueue(route.end, fullDuration);
			}
		}
	}

	return null; // No path found
}
