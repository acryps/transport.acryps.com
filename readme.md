# transport.acryps.com
Simple public transport route time estimation service.
The goal of this service is to provide a somewhat accurate approximation, which is resolved significantly quicker than using the official and accurate APIs of the transport agencies, which often include rate limits.

## Requests
We host an instance with data from the Lugano Region in Ticino from the [Swiss Railway Network GTFS feed](https://gtfs.geops.ch) on our cloud.
```
https://lu.ti.ch.transport.acryps.com/<latitude A>/<longitude A>/<latitude B>/<longitude B>
```

If the distance is walkable (or walking is faster than the public transport option), the service will return only a value in seconds
```json
{
	"walk": 613.4
}
```

The request will return the starting station, end station and an approximated travel time.
```json
{
	"start": {
		"name": "Mendrisio",
		"latitude": 45.86911,
		"longitude": 8.978611,
		"distance": 41, // meters
		"walk": 39 // seconds
	},
	"end": {
		"name": "Lugano, Scuole Molino Nuovo 2",
		"latitude": 46.01486,
		"longitude": 8.955255,
		"distance": 200, // meters
		"walk": 194 // seconds
	},
	"time": 16491 // seconds
}
```

## Importing Data
The data can be imported by running `npm run import <path to GTFS directory>`