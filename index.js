import postgresql from 'pg';
import express from 'express';

import { Point } from './point.js';
import { route } from './path.js';

const database = new postgresql.Client();

let stations = [];
let connections = [];

const server = express();
const walkingSpeed = +process.env.WALKING_SPEED;
const interchangeFactor = +process.env.INTERCHANGE_FACTOR;

server.get('/:startLatitude/:startLongitude/:endLatitude/:endLongitude', (request, response) => {
	const startPosition = new Point(+request.params.startLatitude, +request.params.startLongitude);
	const startStation = startPosition.nearest(stations, station => new Point(station.x, station.y));

	const endPosition = new Point(+request.params.endLatitude, +request.params.endLongitude);
	const endStation = endPosition.nearest(stations, station => new Point(station.x, station.y));

	let time = 0;

	// find route
	const path = route(startStation.item, endStation.item, stations, connections);
	console.log('route', path);

	if (path) {
		let last = path[0];

		for (let next of path.slice(1)) {
			const connection = connections.find(connection => connection.start == last && connection.end == next);
			time += connection.duration;

			last = next;
		}

		// add some time for interchanges between routes, which are ignored by our algorithm
		time *= interchangeFactor;

		// add start and end walking distances
		time += startStation.distance / walkingSpeed;
		time += endStation.distance / walkingSpeed;
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
	connections = await database.query('SELECT * FROM connection WHERE start_id IS NOT NULL AND end_id IS NOT NULL').then(response => response.rows);

	for (let connection of [...connections]) {
		// link stations
		connection.start = stations.find(station => station.id == connection.start_id);
		connection.end = stations.find(station => station.id == connection.end_id);

		// add an inverted connection as a backup
		// make it way slower, as some connections take longer on their propert way back
		connections.push({ start: connection.end, end: connection.start, duration: connection.duration * 1.5 });
	}

	console.log('server started');
});