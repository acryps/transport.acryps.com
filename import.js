import { createReadStream, createWriteStream } from 'fs';
import { parse } from 'csv-parse';
import { join } from 'path';
import postgresql from 'pg';

const base = process.env.SOURCE;

const left = +process.env.BOUNDING_AREA_LEFT;
const top = +process.env.BOUNDING_AREA_TOP;
const right = +process.env.BOUNDING_AREA_RIGHT;
const bottom = +process.env.BOUNDING_AREA_BOTTOM;

console.log(`importing ${base} in ${left} ${top} ${right} ${bottom}`);

let whiz = createWriteStream('graph.dot');
whiz.write('digraph G {\n');

const stops = {};
const stopParser = parse();

const pool = new postgresql.Pool();

console.log('clearing data...');
await pool.connect().then(client => client.query('DELETE FROM station').then(() => client.release()));
await pool.connect().then(client => client.query('DELETE FROM connection').then(() => client.release()));

stopParser.on('readable', async () => {
	let source;
	
	while (source = stopParser.read()) {
		const id = +source[0].split(':')[0];
		const name = source[2];

		const x = +source[4];
		const y = +source[5];

		if (x > left && x < right && y > top && y < bottom) {
			console.log(id, name, x, y);

			if (!(id in stops)) {
				whiz.write(`\tn_${id}[label=${JSON.stringify(name)}];\n`);
				stops[id] = { id, name, x, y };

				await pool.connect().then(client => client.query('INSERT INTO station (name, source_id, x, y) VALUES ($1, $2, $3, $4)', [name, id, x, y]).then(() => client.release()));
			}
		}
	}
});

const trips = {};
const tripParser = parse();

tripParser.on('readable', async () => {
	let source;
	
	while (source = tripParser.read()) {
		const trip = source[0];

		if (source[1] && source[2]) {
			const arrival = source[1].split(':').reduce((time, component, index) => time + component * 60 ** (2 - index), 0);
			const departure = source[2].split(':').reduce((time, component, index) => time + component * 60 ** (2 - index), 0);
			const stop = source[3].split(':')[0];

			if (!(trip in trips)) {
				trips[trip] = [];
			}
			
			trips[trip].push({ stop, arrival, departure });
		}
	}
});

createReadStream(join(base, 'stops.txt')).pipe(stopParser);

stopParser.on('end', () => {
	tripParser.on('end', async () => {
		console.log('limiting calculation area...');
		// delete irrelevant trips
		for (let trip in trips) {
			if (!trips[trip].find(stop => stop.stop in stops)) {
				delete trips[trip];

				continue;
			}

			// delete one stop trips
			if (trips[trip].length == 1) {
				delete trips[trip];

				continue;
			}
		}

		console.log('connecting lines...');
		const connections = [];

		for (let trip of Object.keys(trips)) {
			let last = trips[trip][0];

			for (let next of trips[trip].slice(1)) {
				if (next.stop != last.stop) {
					const existing = connections.find(connection => connection.start == last.stop && connection.end == next.stop);
					const time = next.departure - last.departure;

					connections.push({ 
						start: last.stop,
						end: next.stop,
						
						time
					});
				}

				last = next;
			}
		}

		for (let connection of connections) {
			whiz.write(`\tn_${connection.start} -> n_${connection.end}[label="${connection.time}S"];\n`);

			await pool.connect().then(client => client.query('INSERT INTO connection (duration, start_id, end_id) VALUES ($1, (SELECT id FROM station WHERE source_id = $2), (SELECT id FROM station WHERE source_id = $3))', [connection.time, connection.start, connection.end]).then(() => client.release()));
		}

		whiz.write('}');
		whiz.close();

		console.log('done');
	});

	console.log('importing trips...');
	createReadStream(join(base, 'stop_times.txt')).pipe(tripParser);
	whiz.write('\n');
});