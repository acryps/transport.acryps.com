export class Point {
	static earthRadius = 6378137;

	constructor(
		latitude,
		longitude
	) {
		this.latitude = latitude;
		this.longitude = longitude;
	}

	walk(angle, distance) {
		if (angle === null) {
			return new Point(this.latitude, this.longitude);
		}
		
		// Convert latitude and longitude from degrees to radians
		const latitudeRadians = (this.latitude * Math.PI) / 180;
		const longitudeRadians = (this.longitude * Math.PI) / 180;

		// Calculate the new latitude
		const movedLatitudeRadians = Math.asin(Math.sin(latitudeRadians) * Math.cos(distance / Point.earthRadius) + Math.cos(latitudeRadians) * Math.sin(distance / Point.earthRadius) * Math.cos(angle));

		// Calculate the new longitude
		const movedLongitudeRadians = longitudeRadians + Math.atan2(Math.sin(angle) * Math.sin(distance / Point.earthRadius) * Math.cos(latitudeRadians), Math.cos(distance / Point.earthRadius) - Math.sin(latitudeRadians) * Math.sin(movedLatitudeRadians));

		// Convert the new latitude and longitude from radians to degrees
		return new Point((movedLatitudeRadians * 180) / Math.PI, (movedLongitudeRadians * 180) / Math.PI);
	}

	distance(point) {
		const currentLatitude = (this.latitude * Math.PI) / 180;
		const currentLongitude = (this.longitude * Math.PI) / 180;
		const nextLatitude = (point.latitude * Math.PI) / 180;
		const nextLongitude = (point.longitude * Math.PI) / 180;
		
		// haversine formula
		const latitudeDelta = nextLatitude - currentLatitude;
		const longitudeDelta = nextLongitude - currentLongitude;
		
		const offset = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) + Math.cos(currentLatitude) * Math.cos(nextLatitude) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);
		const centralAngle = 2 * Math.atan2(Math.sqrt(offset), Math.sqrt(1 - offset));
		
		const distance = Point.earthRadius * centralAngle;
		
		return distance;
	}

	clone() {
		return new Point(this.latitude, this.longitude);
	}

	bearing(point) {
		const currentLatitude = (this.latitude * Math.PI) / 180;
		const currentLongitude = (this.longitude * Math.PI) / 180;
		const nextLatitude = (point.latitude * Math.PI) / 180;
		const nextLongitude = (point.longitude * Math.PI) / 180;

		const y = Math.sin(nextLongitude - currentLongitude) * Math.cos(nextLatitude);
		const x = Math.cos(currentLatitude) * Math.sin(nextLatitude) - Math.sin(currentLatitude) * Math.cos(nextLatitude) * Math.cos(nextLongitude - currentLongitude);

		return (Math.atan2(y, x) + (Math.PI * 2)) % (Math.PI * 2);
	}

	toString() {
		return `${this.latitude},${this.longitude}`;
	}

	nearest(data, transformer) {
		const measured = [];

		for (let item of data) {
			measured.push({
				item,
				distance: this.distance(transformer(item))
			});
		}

		measured.sort((a, b) => a.distance - b.distance);

		return measured[0];
	}
}