// src/components/MapComponent.tsx
"use client"
import React, { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import { OSM } from "ol/source";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { fromLonLat, toLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Icon, Style } from "ol/style";
import { defaults as defaultControls } from "ol/control";
import axios from "axios";
import "ol/ol.css";

const pointStyle = new Style({
    image: new Icon({
        src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        scale: 0.05,
    }),
});

const MapComponent: React.FC = () => {
    const mapRef = useRef<Map | null>(null);
    const [source] = useState(new VectorSource());
    const [selectedCoords, setSelectedCoords] = useState<any[]>([]);

    useEffect(() => {
        const tileLayer = new TileLayer({
            source: new OSM(),
        });

        const vectorLayer = new VectorLayer({
            source,
            style: pointStyle,
        });

        const map = new Map({
            target: "map",
            layers: [tileLayer, vectorLayer],
            view: new View({
                center: fromLonLat([85.15, 20.2]),
                zoom: 7,
            }),
            controls: defaultControls(),
        });

        map.on("singleclick", async (e) => {
            const coords = toLonLat(e.coordinate);
            const [lon, lat] = coords;

            const name = prompt("Enter name for this place:");
            if (!name) {
                alert("Name is required!");
                return;
            }

            // Add marker
            const feature = new Feature({
                geometry: new Point(fromLonLat([lon, lat])),
            });
            source.addFeature(feature);

            // Save new place
            await axios.post("http://localhost:5656/api/places", {
                name: name, // use entered name
                type: "Default",
                location: {
                    type: "Point",
                    coordinates: [lon, lat],
                },
            });

            alert(`Location "${name}" saved at: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        });


        mapRef.current = map;
    }, []);

    // Nearby Places
    const handleNearby = async () => {
        const radius = prompt("Enter radius in KM:");
        const coord = mapRef.current?.getView().getCenter();
        if (!coord || !radius) return;

        const [lon, lat] = toLonLat(coord);

        const res = await axios.get(
            `http://localhost:5656/api/places/nearby?latitude=${lat}&longitude=${lon}&radiusKm=${radius}`
        );

        res.data.forEach((place: any) => {
            const feature = new Feature({
                geometry: new Point(fromLonLat([place.lon, place.lat])),
            });
            source.addFeature(feature);
        });

        alert(`${res.data.length} nearby place(s) found.`);
    };

    // Nearest Place
    const handleNearest = async () => {
        const coord = mapRef.current?.getView().getCenter();
        if (!coord) return;

        const [lon, lat] = toLonLat(coord);
        const res = await axios.get(
            `http://localhost:5656/api/places/nearest?latitude=${lat}&longitude=${lon}`
        );

        const { lon: lonN, lat: latN, name } = res.data;

        const feature = new Feature({
            geometry: new Point(fromLonLat([lonN, latN])),
        });
        source.addFeature(feature);

        alert(`Nearest: ${name} at ${latN.toFixed(4)}, ${lonN.toFixed(4)}`);
    };

    // Distance Calculation between 2 selected
    const handleDistance = async () => {
        const ids = prompt("Enter two IDs (e.g. 1,2):");
        if (!ids) return;
        const [id1, id2] = ids.split(",").map(Number);

        const res = await axios.get(
            `http://localhost:5656/api/places/distance?id1=${id1}&id2=${id2}`
        );
        alert(`Distance: ${res.data.toFixed(2)} km`);
    };

    return (
        <div>
            <div className="p-2 space-x-2">
                <button onClick={handleNearby} className="bg-blue-500 text-white p-2 rounded">Find Nearby</button>
                <button onClick={handleNearest} className="bg-green-500 text-white p-2 rounded">Find Nearest</button>
                <button onClick={handleDistance} className="bg-purple-500 text-white p-2 rounded">Calculate Distance</button>
            </div>
            <div id="map" style={{ width: "100%", height: "600px" }}></div>
        </div>
    );
};

export default MapComponent;
