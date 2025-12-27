import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { useRoute } from "@react-navigation/native";
import { useToast } from "react-native-toast-notifications";
import { updateLandArea, fetchLandIdDetails } from "../utils/apiService";
import * as Location from "expo-location";
import { useFormContext } from "../context/FormContext";

const { width, height } = Dimensions.get("window");

export default function MapWebView({ navigation }) {
  const route = useRoute();
  const toast = useToast();
  const { formState, updateForm } = useFormContext();
  const { totalArea, coordinates } = formState;

  const webRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [isClosed, setIsClosed] = useState(false);
  const [area, setArea] = useState({
    sqm: 0,
    hectare: 0,
    acre: 0,
    gunta: 0,
    sqft: 0,
  });

  const [distanceKm, setDistanceKm] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  // send JS to WebView
  const exec = (js) => {
    if (!webRef.current) return;
    webRef.current.injectJavaScript(`${js}; true;`);
  };

  // receive messages from WebView
  // const onMessage = (event) => {
  //   try {
  //     const data = JSON.parse(event.nativeEvent.data);
  //     if (data?.type === "update") {
  //       setPoints(data.points || []);
  //       setIsClosed(Boolean(data.isClosed));
  //       if (data.area) setArea(data.area);
  //       if (typeof data.distanceKm === "number") setDistanceKm(data.distanceKm);
  //     }
  //     if (data?.type === "requestLocation") {
  //       (async () => {
  //         if (locationPermission) {
  //           try {
  //             const location = await Location.getCurrentPositionAsync({});
  //             const { latitude, longitude } = location.coords;
  //             exec(`window.setUserLocation(${latitude}, ${longitude})`);
  //           } catch (err) {
  //             console.warn("Failed to get current location", err);
  //             Alert.alert(
  //               "Location Error",
  //               "Could not fetch your current location."
  //             );
  //           }
  //         } else {
  //           Alert.alert(
  //             "Permission Denied",
  //             "Location permission is required to show your current location."
  //           );
  //         }
  //       })();
  //     }
  //   } catch (e) {
  //     console.warn("Invalid message from WebView", e);
  //   }
  // };

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      // 🔄 Normal updates (points, area, distance)
      if (data?.type === "update") {
        setPoints(data.points || []);
        setIsClosed(Boolean(data.isClosed));
        if (data.area) setArea(data.area);
        if (typeof data.distanceKm === "number") {
          setDistanceKm(data.distanceKm);
        }
        return;
      }

      // 📍 Location request
      if (data?.type === "requestLocation") {
        (async () => {
          if (!locationPermission) {
            Alert.alert(
              "Permission Required",
              "Location permission is required to continue."
            );
            return;
          }

          try {
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            exec(`window.setUserLocation(${latitude}, ${longitude})`);
          } catch (err) {
            Alert.alert("Location Error", "Unable to fetch current location.");
          }
        })();
        return;
      }

      // 🚫 STEP-7: GEO-FENCE ERROR HANDLING
      if (data?.type === "error") {
        toast.show(data.message, {
          type: "danger",
          placement: "top",
          duration: 2500,
        });
        return;
      }
    } catch (e) {
      console.warn("Invalid message from WebView", e);
    }
  };

  const addPointAtCenter = () => exec("addPointAtCenter()");
  const undoLastPoint = () => exec("undoLastPoint()");
  const closeShape = () => exec("closeShape()");
  const resetMeasurement = () => exec("resetMeasurement()");
  const requestState = () => exec("postCurrentState()");

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === "granted");
      } catch (err) {
        console.warn("Error requesting location permission:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!locationPermission) return;

    (async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = location.coords;

        // 👇 Send live location to WebView automatically
        exec(`window.setUserLocation(${latitude}, ${longitude})`);
      } catch (err) {
        console.warn("Auto location fetch failed", err);
        toast.show("Unable to fetch live location", { type: "danger" });
      }
    })();
  }, [locationPermission]);

  const handleSave = () => {
    if (!points || points.length < 3) {
      Alert.alert("Validation", "Add at least 3 points to form a polygon.");
      return;
    }

    updateForm({
      totalArea: {
        hectare: parseFloat(area.hectare.toFixed(6)),
        acre: parseFloat(area.acre.toFixed(6)),
        gunta: parseFloat(area.gunta.toFixed(6)),
        sqft: parseFloat(area.sqft.toFixed(2)),
      },
      coordinates: points,
    });

    navigation.goBack();
  };

  // HTML with helper to accept points from native: window.setPointsFromNative(...)
  const html = `
  <!doctype html>
  <html>
  <head>
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        html,body,#map{height:100%;margin:0;padding:0}
        .leaflet-control-layers { font-size:14px; }
        .location-marker {
            background: none;
            border: none;
        }
        .leaflet-control a:hover {
            background-color: #f4f4f4;
        }
        .google-earth-location {
            width: 18px;
            height: 18px;
            background-color: #4285F4;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 5px rgba(0,0,0,0.5);
        }
        .leaflet-control-location-clicked {
            background-color: #f4f4f4 !important;
        }
        #loader {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            z-index: 1000;
            display: none;
        }
        @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
    </style>
  </head>
  <body>
    <div id="loader"></div>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js"></script>
    <script>
      let userLocation = null;
      const MAX_DISTANCE_KM = 0.5; // 1 km limit

      (function(){
        const map = L.map('map').setView([20.5937,78.9629], 6);
        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' });
        const esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' });
        osm.addTo(map);
        L.control.layers({ "Street (OSM)": osm, "Satellite (Esri)": esriSat }, null, { collapsed: false }).addTo(map);

        // Add location control
         const locateControl = L.control({position: 'topleft'});
        locateControl.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            // ask RN for location instead of using navigator.geolocation inside WebView
            div.innerHTML = '<a href="#" title="Show my location" style="display:flex;width:30px;height:30px;line-height:30px;background:white;text-align:center;font-size:20px;color:#666;text-decoration:none;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"></path></svg></a>';
            div.onclick = function(e) {
                e.preventDefault();
                L.DomEvent.stopPropagation(e);
                document.getElementById('loader').style.display = 'block';
                try {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestLocation' }));
                } catch(err) {
                  console.warn('postMessage failed', err);
                  document.getElementById('loader').style.display = 'none';
                }
                return false;
            };
            return div;
        };
        locateControl.addTo(map);
        // helper function called from RN to set user location and center map

        window.setUserLocation = function(lat, lng){
          try {
            document.getElementById('loader').style.display = 'none';

            userLocation = [lat, lng];

            if (window.locationMarker) {
              map.removeLayer(window.locationMarker);
            }

            window.locationMarker = L.marker([lat, lng], {
              icon: L.divIcon({
                html: '<div class="google-earth-location"></div>',
                className: 'location-marker',
                iconSize: [22, 22],
                iconAnchor: [11, 11]
              })
            }).addTo(map);

            // Draw 1km radius circle
            if (window.radiusCircle) {
              map.removeLayer(window.radiusCircle);
            }

            window.radiusCircle = L.circle([lat, lng], {
              radius: MAX_DISTANCE_KM * 1000,
              color: '#4285F4',
              fillOpacity: 0.08,
              dashArray: '5,5'
            }).addTo(map);

            map.setView([lat, lng], 17);
          } catch(e) {
            console.error('setUserLocation error', e);
          }
        };

        function isWithinAllowedDistance(lat, lng) {
          if (!userLocation) return false;

          const from = turf.point([userLocation[1], userLocation[0]]);
          const to = turf.point([lng, lat]);

          const distance = turf.distance(from, to, { units: 'kilometers' });

          return distance <= MAX_DISTANCE_KM;
        }


        let pts = [];
        let markerLayer = L.layerGroup().addTo(map);
        let drawingLayer = null;

        function updateLayers(){
          markerLayer.clearLayers();
          pts.forEach((p) => L.marker(p).addTo(markerLayer));
          if(drawingLayer){ map.removeLayer(drawingLayer); drawingLayer = null; }
          if(pts.length > 1){
            const ls = L.polyline(pts, {color:'red'}).addTo(map);
            drawingLayer = ls;
          }
          if(pts.length > 2 && pts[0][0] === pts[pts.length-1][0] && pts[0][1] === pts[pts.length-1][1]){
            if (drawingLayer) { map.removeLayer(drawingLayer); drawingLayer = null; }
            drawingLayer = L.polygon(pts, {color:'red', fillOpacity:0.2}).addTo(map);
          }
          postCurrentState();
        }

        // Replace the computeAreaAndDistance function in your HTML string with this:
        function computeAreaAndDistance(){
          // Constants based on your specifications
          const SQFT_PER_GUNTA = 1089;      // 1 gunta = 1089 sqft
          const GUNTA_PER_ACRE = 40;        // 1 acre = 40 guntas
          const ACRE_PER_HECTARE = 2.5;     // 1 hectare = 2.5 acres

          let areaObj = { sqm: 0, hectare: 0, acre: 0, gunta: 0, sqft: 0 };
          let distanceKm = 0;

          try {
            if (pts.length > 2 && pts[0][0] === pts[pts.length-1][0] && pts[0][1] === pts[pts.length-1][1]) {
              // Create polygon using [lng, lat] for turf
              const poly = turf.polygon([pts.map(p => [p[1], p[0]])]);
              
              // Get area in square meters from turf
              const sqm = turf.area(poly);
              
              // Convert to square feet first
              const sqft = sqm * 10.7639104;
              
              // Calculate other units using your conversion ratios
              const gunta = sqft / SQFT_PER_GUNTA;
              const acre = gunta / GUNTA_PER_ACRE;
              const hectare = acre / ACRE_PER_HECTARE;

              areaObj = {
                sqm: sqm,
                sqft: sqft,
                gunta: gunta,
                acre: acre,
                hectare: hectare
              };
            }

            if (pts.length > 1) {
              const line = turf.lineString(pts.map(p => [p[1], p[0]]));
              distanceKm = turf.length(line, {units: 'kilometers'});
            }
          } catch(e) {
            console.error('Area calculation error:', e);
          }

          return { areaObj, distanceKm };
        }

        function postCurrentState(){
          const { areaObj, distanceKm } = computeAreaAndDistance();
          const payload = {
            type: 'update',
            points: pts.map(p => ({ latitude: p[0], longitude: p[1] })),
            isClosed: (pts.length>2 && pts[0][0] === pts[pts.length-1][0] && pts[0][1] === pts[pts.length-1][1]),
            area: {
              sqm: areaObj.sqm,
              hectare: areaObj.hectare,
              acre: areaObj.acre,
              gunta: areaObj.gunta,
              sqft: areaObj.sqft
            },
            distanceKm: distanceKm
          };
          try { window.ReactNativeWebView.postMessage(JSON.stringify(payload)); } catch(e){}
        }

        map.on('click', function (e) {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;

          // 🔒 1km restriction for ALL actions
          if (!isWithinAllowedDistance(lat, lng)) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: "error",
                message: "You can only work within 1 km of your current location."
              })
            );
            return;
          }

          // ✏️ SHIFT + CLICK → EDIT NEAREST POINT
          if (e.originalEvent.shiftKey && pts.length > 0) {
            const newPoint = [lat, lng];

            let minDist = Infinity;
            let minIdx = 0;

            pts.forEach((p, i) => {
              const d = map.distance(e.latlng, L.latLng(p[0], p[1]));
              if (d < minDist) {
                minDist = d;
                minIdx = i;
              }
            });

            // Prevent editing closing point directly
            if (
              pts.length > 2 &&
              pts[0][0] === pts[pts.length - 1][0] &&
              pts[0][1] === pts[pts.length - 1][1] &&
              minIdx === pts.length - 1
            ) {
              minIdx = 0;
            }

            pts[minIdx] = newPoint;
          }
          // NORMAL CLICK → ADD POINT
          else {
            pts.push([lat, lng]);
          }

          updateLayers();
        });

        window.addPointAtCenter = function(){
          const c = map.getCenter();

          if (!isWithinAllowedDistance(c.lat, c.lng)) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Center point is outside allowed 1 km radius.'
            }));
            return;
          }

          pts.push([c.lat, c.lng]);
          updateLayers();
        };


        window.undoLastPoint = function(){
          if(pts.length === 0) return;
          if(pts.length>2 && pts[0][0] === pts[pts.length-1][0] && pts[0][1] === pts[pts.length-1][1]){
            pts = pts.slice(0, -1);
          } else {
            pts = pts.slice(0, -1);
          }
          updateLayers();
        };

        window.closeShape = function(){
          if(pts.length > 2 && !(pts[0][0] === pts[pts.length-1][0] && pts[0][1] === pts[pts.length-1][1])){
            pts.push(pts[0]);
            updateLayers();
          }
        };

        window.resetMeasurement = function(){
          pts = [];
          markerLayer.clearLayers();
          if(drawingLayer){ map.removeLayer(drawingLayer); drawingLayer = null; }
          postCurrentState();
        };

        // accept points array from native: [{latitude, longitude}, ...]
        window.setPointsFromNative = function(arr){
          try {
            pts = (arr || []).map(p => [p.latitude, p.longitude]);
            // if last equals first, keep closed
            if(pts.length > 1 && pts[0][0] === pts[pts.length-1][0] && pts[0][1] === pts[pts.length-1][1]){
              // already closed
            }
            updateLayers();
            if(pts.length){
              // fit to coords
              map.fitBounds(pts);
            }
          } catch(e){
            console.error('setPointsFromNative error', e);
          }
        };

        window.postCurrentState = postCurrentState;
          postCurrentState();
        })();

    </script>
  </body>
  </html>
  `;

  // request state shortly after mount to sync if webview already has points
  useEffect(() => {
    const t = setTimeout(() => requestState(), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          geolocationEnabled={true}
          style={styles.webview}
        />
        <View pointerEvents="none" style={styles.crosshair}>
          <View style={styles.crossVertical} />
          <View style={styles.crossHorizontal} />
        </View>
      </View>

      {/* // Replace the overlay section in the return statement with: */}
      <View style={styles.overlay}>
        <Text style={styles.infoText}>
          Distance: {distanceKm.toFixed(3)} km
        </Text>

        {/* Area display - shows all units */}
        <View style={styles.areaContainer}>
          <Text style={styles.areaText}>Area Measurements:</Text>
          <Text style={styles.areaValue}>
            {area.sqft.toFixed(2)} sq.ft{"\n"}
            {area.gunta.toFixed(2)} gunta{"\n"}
            {area.acre.toFixed(4)} acre{"\n"}
            {area.hectare.toFixed(4)} ha
          </Text>
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={addPointAtCenter}>
            <Text style={styles.btnText}>Add Point</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={undoLastPoint}>
            <Text style={styles.btnText}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={closeShape}>
            <Text style={styles.btnText}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={resetMeasurement}>
            <Text style={styles.btnText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: points.length < 3 ? "#666" : "#28a745" },
            ]}
            onPress={() => {
              // Add minimum area validation (e.g., 100 sq ft)
              if (area.sqft < 100) {
                Alert.alert(
                  "Invalid Area",
                  "The measured area must be at least 100 square feet."
                );
                return;
              }
              setModalVisible(true);
            }}
            disabled={!points || points.length < 3}
          >
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm Save</Text>
            <Text style={styles.modalMsg}>
              Save the measured coordinates and area?
            </Text>

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[
                  styles.btn,
                  { backgroundColor: "#28a745", minWidth: 100 },
                ]}
                onPress={() => {
                  setModalVisible(false);
                  handleSave();
                }}
              >
                <Text style={styles.btnText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btn,
                  { backgroundColor: "#6c757d", minWidth: 100 },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { flex: 1, backgroundColor: "#eee" },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  overlay: {
    position: "absolute",
    bottom: 16,
    left: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  areaContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    width: "100%",
  },
  areaText: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 4,
  },
  areaValue: {
    color: "#fff",
    fontSize: 13,
  },
  infoText: {
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  btn: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: "#4285F4",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
  crosshair: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -12,
    marginTop: -12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  crossVertical: {
    position: "absolute",
    width: 2,
    height: 24,
    backgroundColor: "red",
  },
  crossHorizontal: {
    position: "absolute",
    height: 2,
    width: 24,
    backgroundColor: "red",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: width * 0.85,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  modalMsg: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
});
