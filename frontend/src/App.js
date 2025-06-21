import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { loadScript } from "./utils/loadScript";
const defaultIcon = new Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

function LocationPicker({ setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return null;
}
const carOptions = [
  { name: "Mini", type: "Hatchback", rate: 1 },
  { name: "Sedan", type: "Sedan", rate: 2 },
  { name: "SUV", type: "SUV", rate: 3 },
  { name: "Luxury", type: "Luxury", rate: 4 },
];
function Page1({ setTripDetails }) {
  const [fromPos, setFromPos] = useState(null);
  const [toPos, setToPos] = useState(null);
  const [fromName, setFromName] = useState("");
  const [toName, setToName] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [tripType, setTripType] = useState("");
  const [travelDate, setTravelDate] = useState("");

  const navigate = useNavigate();

  // 🔄 Reverse Geocode to get address
  const reverseGeocode = async (pos) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`
    );
    const data = await res.json();
    return data.display_name;
  };

  // 📍 Geocode typed address
  const geocode = async (query) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=5`
    );
    return await res.json();
  };

  // 📌 Autocomplete for 'From'
  useEffect(() => {
    if (fromName.length < 3) return setFromSuggestions([]);
    const timeout = setTimeout(async () => {
      const res = await geocode(fromName);
      setFromSuggestions(res);
    }, 300);
    return () => clearTimeout(timeout);
  }, [fromName]);

  // 📌 Autocomplete for 'To'
  useEffect(() => {
    if (toName.length < 3) return setToSuggestions([]);
    const timeout = setTimeout(async () => {
      const res = await geocode(toName);
      setToSuggestions(res);
    }, 300);
    return () => clearTimeout(timeout);
  }, [toName]);

  // 📍 Mark My Location
  const markMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setFromPos({ lat: coords.latitude, lng: coords.longitude }),
      (err) => alert("Unable to get location: " + err.message)
    );
  };

  // 📦 Handle Continue
  const handleContinue = async () => {
    if (!fromPos || !toPos) return alert("Select both points");

    const [fromLabel, toLabel] = await Promise.all([
      reverseGeocode(fromPos),
      reverseGeocode(toPos),
    ]);

    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromPos.lng},${fromPos.lat};${toPos.lng},${toPos.lat}?overview=false`
    );
    const data = await res.json();
    const dist = data.routes[0].distance / 1000;

    setTripDetails({
      from: fromLabel,
      to: toLabel,
      fromPos,
      toPos,
      tripType,
      distance: dist,
      travelDate,
    });

    navigate("/car-selection");
  };

  return (
    <div className="container mx-auto p-4">
      {/* From Location Input */}
     

      {/* Map */}
      <MapContainer
        center={[12.97, 77.59]}
        zoom={11}
        style={{ height: "300px", width: "100%", marginTop: "1rem" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OSM contributors"
        />

        {!fromPos && <LocationPicker setPosition={setFromPos} />}
        {fromPos && !toPos && <LocationPicker setPosition={setToPos} />}

        {fromPos && <Marker position={fromPos} icon={defaultIcon} />}
        {toPos && <Marker position={toPos} icon={defaultIcon} />}
      </MapContainer>

      {/* Buttons */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <button onClick={markMyLocation} className="btn text-xs border w-32">
          Mark My Location
        </button>
        <button
          className="btn text-xs border w-24"
          disabled={!fromPos || !toPos}
          onClick={() => setFromPos(null)}
        >
          Reset From
        </button>
        <button
          className="btn text-xs border w-24"
          disabled={!toPos}
          onClick={() => setToPos(null)}
        >
          Reset To
        </button>
      </div>
 <label className="block font-semibold">From:</label>
      <div className="relative">
        <input
          type="text"
          className="input w-full"
          placeholder="Type starting location"
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
        />

        {fromSuggestions.length > 0 && (
          <ul className="absolute z-50 w-full bg-white border shadow max-h-40 overflow-y-auto text-sm">
            {fromSuggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => {
                  setFromPos({
                    lat: parseFloat(s.lat),
                    lng: parseFloat(s.lon),
                  });
                  setFromName(s.display_name);
                  setFromSuggestions([]);
                }}
                className="p-2 hover:bg-gray-200 cursor-pointer"
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* To Location Input */}
      <label className="block font-semibold mt-4">To:</label>
      <div className="relative">
        <input
          type="text"
          className="input w-full"
          placeholder="Type destination"
          value={toName}
          onChange={(e) => setToName(e.target.value)}
        />

        {toSuggestions.length > 0 && (
          <ul className="absolute z-50 w-full bg-white border shadow max-h-40 overflow-y-auto text-sm">
            {toSuggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => {
                  setToPos({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
                  setToName(s.display_name);
                  setToSuggestions([]);
                }}
                className="p-2 hover:bg-gray-200 cursor-pointer"
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Trip Type */}
      <div className="radio-group mt-4 mb-2">
        <label className="radio-label font-semibold ">
          <input
            type="radio"
            name="trip"
            value="one-way"
            onChange={() => setTripType("one-way")}
          />
          <span className="radio-custom"></span>
          One Way
        </label>
        <p className="text-gray-700">or</p>
        <label className="radio-label font-semibold">
          <input
            type="radio"
            name="trip"
            value="two-way"
            onChange={() => setTripType("two-way")}
          />
          <span className="radio-custom"></span>
          Two Way
        </label>
      </div>

      {/* Travel Date */}
      <div className="mt-2">
        <label>Date of Travel</label>
        <br />
        <input
          type="date"
          value={travelDate}
          onChange={(e) => setTravelDate(e.target.value)}
        />
      </div>

      {fromPos && toPos && tripType && travelDate && (
        <div className="flex justify-end mt-4">
          <button className="btn" onClick={handleContinue}>
            Select Car
          </button>
        </div>
      )}
    </div>
  );
}

function Page2({ tripDetails, setSelectedCar, setTotalFare }) {
  const [selected, setSelected] = useState(null);
  const [passengers, setPassengers] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const navigate = useNavigate();

  const calculateFare = (car, pax = passengers) => {
    const multiplier = tripDetails.tripType === "two-way" ? 2 : 1;
    const baseFare = car.rate * tripDetails.distance * multiplier;
    return baseFare * pax;
  };

  const handleCarSelect = (car) => {
    setSelected(car);
    const fare = calculateFare(car);
    setTotalFare(fare);
    setSelectedCar(car);
  };

  const handlePassengersChange = (e) => {
    const pax = Math.max(1, parseInt(e.target.value, 10) || 1);
    setPassengers(pax);
    if (selected) {
      const fare = calculateFare(selected, pax);
      setTotalFare(fare);
    }
  };

  const handleConfirm = () => {
    if (!name.trim() || !email.trim() || !mobile.trim() || !selected) {
      return alert("Please fill in all details and select a car.");
    }

    const fullBookingData = {
      username: name,
      email,
      number: mobile,
      passenger: passengers,
      carName: selected.name,
      rate: selected.rate,
      distance: tripDetails.distance,
      trip: tripDetails.tripType,
      from: tripDetails.from,
      to: tripDetails.to,
      tripDate: tripDetails.travelDate,

      totalFare: Math.floor(calculateFare(selected)),
    };

    axios
      .post("http://localhost:4000/api/booking", fullBookingData)
      .then((response) => {
        navigate("/login");
      })
      .catch(console.error);
  };

  return (
    <div className="container p-4 max-w-md mx-auto mt-2">
      <h2 className="text-xl font-bold mb-4">Select Car </h2>

      <p className="font-semibold">
        Distance: {tripDetails.distance.toFixed(0)} km
      </p>

      <label className="mt-4 block font-semibold">Number of Passengers:</label>
      <input
        type="number"
        min="1"
        value={passengers}
        onChange={handlePassengersChange}
        className="input mt-1"
      />

      <label className="mt-4 block font-semibold">Choose a Car:</label>
      <select
        className="input mt-1"
        onChange={(e) => handleCarSelect(JSON.parse(e.target.value))}
        defaultValue=""
      >
        <option value="" disabled>
          Select a car
        </option>
        {carOptions.map((car, i) => (
          <option key={i} value={JSON.stringify(car)}>
            {car.name} – {car.type} – ₹{car.rate}/km
          </option>
        ))}
      </select>

      {selected && (
        <p className="mt-4 font-medium">
          Total Fare: ₹{Math.floor(calculateFare(selected))}
        </p>
      )}

      <h3 className="mt-6 text-lg font-semibold">Passenger Details</h3>
      <input
        type="text"
        placeholder="Full Name"
        className="input mt-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email Address"
        className="input mt-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="tel"
        placeholder="Mobile Number"
        className="input mt-2"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />

      <button className="btn mt-4 w-full" onClick={handleConfirm}>
        Confirm Booking
      </button>
    </div>
  );
}

function Page3({ tripDetails, selectedCar, totalFare }) {
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState();
  const [payid, setPayid] = useState(null);
  function formatTravelDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr; // Invalid date fallback

    const options = { day: "numeric", month: "short", year: "numeric" };
    // Format using locale-aware method
    return date.toLocaleDateString("en-GB", options);
  }

  useEffect(() => {
    if (!tripDetails || !selectedCar || totalFare == null) return;
    if (paymentDetails) return; // ensure only one call
  }, [tripDetails, selectedCar, totalFare, paymentDetails]);
  const handleRazorpay = async () => {
    const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!ok) return alert("Failed to load Razorpay SDK");

    const amount = (parseFloat(paymentDetails?.totalFare) || totalFare) * 100;
    const options = {
      key: "rzp_test_Lli7aNJBplhrXo",
      amount,
      currency: "INR",
      name: "Taxi App",
      description: "Trip Fare Payment",
      handler: (res) => {
        navigate("/login");
      },

      theme: { color: "#3399cc" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };
  console.log({
    to: tripDetails.to,
    from: tripDetails.from,
    trip: tripDetails.tripType,
    carType: selectedCar.name,
    rate: selectedCar.rate,
    distance: tripDetails.distance,
    tripdate: tripDetails.travelDate,
    totalFare: totalFare.toFixed(0),
  });
  return (
    <div className="container p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Trip Detail</h2>
      <p className="border-b py-2 border-gray-400 font-semibold">
        From: <span className="">{tripDetails.from}</span>
      </p>

      <p className="border-b py-2 border-gray-400 font-semibold">
        To: {tripDetails.to}
      </p>
      <p className="border-b py-2 border-gray-400 font-semibold">
        Trip: {tripDetails.tripType}
      </p>
      <p className="border-b py-2 border-gray-400 font-semibold">
        Car: {selectedCar.name}
      </p>
      <p className="border-b py-2 border-gray-400 font-semibold">
        Rate: ₹{selectedCar.rate}/km
      </p>
      <p className="border-b py-2 border-gray-400 font-semibold">
        Distance: {tripDetails.distance.toFixed(0)} km
      </p>
      <p className="border-b py-2 border-gray-400 font-semibold">
        Date of Travel: {formatTravelDate(tripDetails.travelDate)}
      </p>
      <p className=" py-2 border-gray-400 font-semibold">
        Total Fare: ₹{totalFare.toFixed(0)}
      </p>
      <div className="border-b"></div>
      <h2 className="text-xl font-bold my-4">Payment Detail</h2>
      {[
        { label: "Total Price", value: totalFare.toFixed(0) },
        { label: "Other Fees", value: paymentDetails?.otherFess },
        { label: "Platform Fees", value: paymentDetails?.platFormFess },
        { label: "Discount", value: paymentDetails?.discount },
        { label: "Total", value: paymentDetails?.totalFare },
      ].map((item, i) => (
        <p
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #ccc",
            padding: "0.5rem 0",
            fontWeight: 600,
          }}
        >
          {item?.label}:<span>{item?.value}</span>
        </p>
      ))}

      <button className="btn mt-4 w-full" onClick={handleRazorpay}>
        Pay ₹{(parseFloat(paymentDetails?.totalFare) || totalFare).toFixed(0)}
      </button>
    </div>
  );
}

function Page4() {
  const [otp, setOtp] = useState("");
  const [success, setSuccess] = useState(false);
  const [rideData, setRideData] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState();
  const [payid, setPayid] = useState(null);
  const handleRazorpay = async () => {
    const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!ok) return alert("Failed to load Razorpay SDK");

    const amount = parseFloat(rideData?.ride?.totalFare) * 100;
    const options = {
      key: "rzp_test_Lli7aNJBplhrXo",
      amount,
      currency: "INR",
      name: "Taxi App",
      description: "Trip Fare Payment",
      handler: (res) => {},

      theme: { color: "#3399cc" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };
  const verifyOtp = () => {
    axios
      .post("http://localhost:4000/api/otp-verify", { otp })
      .then((res) => {
        if (res.status === 200) {
          setSuccess(true);
          setRideData(res.data);
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="container p-4 max-w-md mx-auto">
      {!success ? (
        <div className="mt-4">
          <input
            placeholder="Enter OTP"
            className="input"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button className="btn mt-2" onClick={verifyOtp}>
            Verify OTP
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2 text-green-600">
            ✅ Ride Booked
          </h2>
          <p className="mb-1 text-lg">
            <span className="font-bold">Ride Code: </span> 
            <span className="underline font-bold underline-offset-2 text-red-400">
            {rideData.code}
            </span>
          </p>
          <p className="mb-1">
            <strong>Name:</strong> {rideData.ride.username}
          </p>
          <p className="mb-1">
            <strong>Email:</strong> {rideData.ride.email}
          </p>
          <p className="mb-1">
            <strong>Pickup:</strong> {rideData.ride.pickup}
          </p>
          <p className="mb-1">
            <strong>Destination:</strong> {rideData.ride.destination}
          </p>
          <p className="mb-1">
            <strong>Trip:</strong> {rideData.ride.trip}
          </p>
          <p className="mb-1">
            <strong>Car Type:</strong> {rideData.ride.carType}
          </p>
          <p className="mb-1">
            <strong>Passengers:</strong> {rideData.ride.passenger}
          </p>
          <p className="mb-1">
            <strong>Distance:</strong> {rideData.ride.distance} km
          </p>
          <p className="mb-1">
            <strong>Total Fare:</strong> ₹{rideData.ride.totalFare}
          </p>
          <p className="mb-1">
            <strong>Date:</strong>{" "}
            {new Date(rideData.ride.date).toLocaleDateString()}
          </p>

          <button
            onClick={handleRazorpay}
            className="btn mt-4 w-full bg-green-700 hover:bg-green-800"
          >
            Pay ₹{rideData.ride.totalFare} and Complete Ride
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  const [tripDetails, setTripDetails] = useState({});
  const [selectedCar, setSelectedCar] = useState(null);
  const [totalFare, setTotalFare] = useState(0);
  const [passengerInfo, setPassengerInfo] = useState([]);
  return (
    <>
      <div className="bg-blue-900 text-white  p-5 mb-2 text-left">
        <h1 className="text-sm font-bold mb-2">Taxi App</h1>
        <h2 className="text-3xl pt-10 font-bold mb-1">
          Car hire for any kind of trip
        </h2>
        <p className="text-lg mb-4 font-semibold">
          Great cars at great prices, from the biggest car rental companie
        </p>
      </div>
      <Router>
        <Routes>
          <Route path="/" element={<Page1 setTripDetails={setTripDetails} />} />
          <Route
            path="/car-selection"
            element={
              <Page2
                setPassengerInfo={setPassengerInfo}
                tripDetails={tripDetails}
                setSelectedCar={setSelectedCar}
                setTotalFare={setTotalFare}
              />
            }
          />
          <Route
            path="/summary"
            element={
              <Page3
                tripDetails={tripDetails}
                selectedCar={selectedCar}
                totalFare={totalFare}
              />
            }
          />
          <Route path="/login" element={<Page4 />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
