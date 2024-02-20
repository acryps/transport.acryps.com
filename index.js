import postgresql from 'pg';
import QueryStream from 'pg-query-stream';
import express from 'express';

import { Point } from './point.js';
import { Graph } from './path.js';

const database = new postgresql.Client();

let stations = [];

const graph = new Graph();

const server = express();
const walkingSpeed = +process.env.WALKING_SPEED;

server.get('/:startLatitude/:startLongitude/:endLatitude/:endLongitude', (request, response) => {
	const startPosition = new Point(+request.params.startLatitude, +request.params.startLongitude);
	const startStation = startPosition.nearest(stations, station => new Point(station.x, station.y));

	const endPosition = new Point(+request.params.endLatitude, +request.params.endLongitude);
	const endStation = endPosition.nearest(stations, station => new Point(station.x, station.y));

	let time = 0;

	// find route
	const path = graph.route(startStation.item, endStation.item);
	console.log('route', path);

	if (path) {
		// add start and end walking distances
		time += startStation.distance / walkingSpeed;
		time += endStation.distance / walkingSpeed;

		/*let last = path[0];

		for (let next of path.slice(1)) {
			const connection = connections.find(connection => connection.start == last && connection.end == next);
			time += connection.duration;

			last = next;
		}*/

		console.log(path);
	} else {
		time = Infinity;
	}

	// just walk if it is faster anyways
	const walkingTime = startPosition.distance(endPosition) / walkingSpeed;

	if (walkingTime < time) {
		time = walkingTime;
	}

	response.json({
		start: startStation,
		end: endStation,

		time
	});
});

server.listen(process.env.PORT ?? 4411, async () => {
	console.log('connecting to database...');
	await database.connect();

	console.log('loading stations...');
	stations = await database.query('SELECT * FROM station').then(response => response.rows);

	console.log('loading connections...');
	const stream = await database.query(new QueryStream('SELECT * FROM connection WHERE start_id IS NOT NULL AND end_id IS NOT NULL AND route LIKE \'%:1\''));

	const nameNode = (station, route) => `${station.id}-${route}`;

	stream.on('data', connection => {
		// link stations
		const start = stations.find(station => station.id == connection.start_id);
		const end = stations.find(station => station.id == connection.end_id);

		graph.addStation(start);
		graph.addStation(end);

		graph.addConnection(start, end, connection.route, connection.duration);

		// add an inverted connection as a backup
		// make it way slower, as some connections take longer on their propert way back
		graph.addConnection(end, start, connection.duration * 1.5);
	});

	console.log('server started');
});