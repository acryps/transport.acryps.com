export class Graph {
	constructor() {
		this.map = new Map();
	}

	addStation(station) {
		if (this.map.has(station)) {
			return;
		}

		this.map.set(station, []);
	}

	addWaypoint(station, route) {
		for (let waypoint of this.map.keys()) {
			if (waypoint.station == station && waypoint.route == route) {
				this.map.get(station).push({ node: waypoint, weight: 10 });
				
				return waypoint;
			}
		}

		const waypoint = { station, route };
		this.map.set(waypoint, [{ node: station, weight: 10 }]);
		this.map.get(station).push({ node: waypoint, weight: 10 });

		return waypoint;
	}

	addConnection(start, end, route, weight) {
		this.map.get(this.addWaypoint(start, route)).push({ node: end, weight });
		this.map.get(this.addWaypoint(end, route)).push({ node: start, weight });
	}

	route(startNode, endNode) {
		const distances = new Map();
		const previous = new Map();
		const priorityQueue = new PriorityQueue();

		// Initialize distances and priority queue
		for (const node of this.map.keys()) {
			distances.set(node, node === startNode ? 0 : Infinity);
			priorityQueue.enqueue(node, distances.get(node));
			previous.set(node, null);
		}

		while (!priorityQueue.isEmpty()) {
			const currentNode = priorityQueue.dequeue();

			if (currentNode == endNode) {
				const path = [];
				let current = endNode;

				while (current !== null) {
					path.unshift(current);
					current = previous.get(current);
				}

				return path;
			}

			const neighbors = this.map.get(currentNode);

			for (const neighbor of neighbors) {
				const newDistance = distances.get(currentNode) + neighbor.weight;
				
				if (newDistance < distances.get(neighbor.node)) {
					distances.set(neighbor.node, newDistance);
					previous.set(neighbor.node, currentNode);
					priorityQueue.enqueue(neighbor.node, newDistance);
				}
			}
		}

		return null;
	}
}

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