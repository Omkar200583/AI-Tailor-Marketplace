import { Schema } from "mongoose";

export const oid = (ref: string, required = false) => ({ type: Schema.Types.ObjectId, ref, required });

// GeoJSON Point definition (use with a "2dsphere" index)
export const geoPoint = (required = false) => ({
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required,
    validate: {
      validator: (v: number[]) => !v || v.length === 0 || (v.length === 2 && Math.abs(v[0]) <= 180 && Math.abs(v[1]) <= 90),
      message: "coordinates must be [longitude, latitude]",
    },
  },
});

export const toPoint = (latitude: number, longitude: number) => ({ type: "Point" as const, coordinates: [longitude, latitude] });
