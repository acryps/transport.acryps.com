CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE station (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	source_id TEXT,

	name TEXT,

	x REAL,
	y REAL
);

CREATE TABLE connection (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	duration REAL,

	start_id UUID CONSTRAINT start__ REFERENCES station (id),
	end_id UUID CONSTRAINT end__ REFERENCES station (id)
);