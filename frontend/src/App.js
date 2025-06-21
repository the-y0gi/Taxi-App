import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import axios from "axios";
import { useDebounce } from "use-debounce";
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
  const [tripType, setTripType] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const navigate = useNavigate();

  const reverseGeocode = async (pos) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`
    );
    const data = await res.json();
    return data.display_name;
  };

  const handleContinue = async () => {
    if (!fromPos || !toPos) return alert("Select both points on the map");

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
      <MapContainer
        center={[12.97, 77.59]}
        zoom={11}
        style={{ height: "300px", width: "100%" }}
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

      <div className="mt-4">
        <button
          className="mr-2"
          disabled={!fromPos || !toPos}
          onClick={() => setFromPos(null)}
        >
          Reset From
        </button>
        <button disabled={!toPos} onClick={() => setToPos(null)}>
          Reset To
        </button>
      </div>

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
  const navigate = useNavigate();
  const handleCarSelect = (car) => {
    setSelected(car);
    const multiplier = tripDetails.tripType === "two-way" ? 2 : 1;
    const fare = car.rate * tripDetails.distance * multiplier;
    setTotalFare(fare);
    setSelectedCar(car);
  };

  return (
    <div className="container p-4 max-w-md mx-auto mt-2">
      <h2 className="text-xl font-bold mb-4">Select Car</h2>
      <p className="font-semibold">
        Distance: {tripDetails.distance.toFixed(0)} km
      </p>
      <select
        className="input mt-1"
        onChange={(e) => handleCarSelect(JSON.parse(e.target.value))}
      >
        <option>Select a car</option>
        {carOptions.map((car, i) => (
          <option key={i} value={JSON.stringify(car)}>
            {car.name} - {car.type} - ₹{car.rate}/km
          </option>
        ))}
      </select>
      {selected && (
        <>
          <p className="mt-4 font-medium">
            Total Fare: ₹
            {Math.floor(
              selected.rate *
                tripDetails.distance *
                (tripDetails.tripType === "two-way" ? 2 : 1)
            )}
          </p>
          <button className="btn mt-4" onClick={() => navigate("/summary")}>
            Confirm Booking
          </button>
        </>
      )}
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

    axios
      .post("http://localhost:4000/api/booking", {
        to: tripDetails.to,
        from: tripDetails.from,
        trip: tripDetails.tripType,
        carName: selectedCar.name,
        rate: selectedCar.rate,
        distance: tripDetails.distance,
        tripDate: tripDetails.travelDate,
        totalFare: totalFare.toFixed(0),
      })
      .then((response) => {
        setPaymentDetails(response.data);
      })
      .catch(console.error);
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [username, setName] = useState("Manju");
  const [success, setSuccess] = useState(false);
  const handleLogin = () => {
    try {
      setOtpSent(true);
      axios
        .post("http://localhost:4000/api/login", { username, email, password })
        .then((res) => console.log(res?.data))
        .catch((err) => console.log(err));
    } catch (err) {
      console.log(err);
    }
  };

  const verifyOtp = () => {
    try {
      axios
        .post("http://localhost:4000/api/otp-verify", { email, otp })
        .then((res) => {
          if (res.status === 200) {
            setSuccess(true);
            setOtpSent(false);
          }
        })
        .catch((err) => console.log(err));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="container p-4 max-w-md mx-auto">
      {!otpSent && !success && (
        <>
          <h2 className="text-xl font-bold mb-4">Login to Confirm</h2>
          <input
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Password"
            className="input mt-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="btn flex justify-center mt-4"
            onClick={handleLogin}
          >
            Login
          </button>
        </>
      )}
      {otpSent && (
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
      )}
      {success && (
        <div>
          <p className="mt-4 rounded-lg text-center bg-green-100 p-2 w-full border border-green-400">
            Successfull Please Check you email for booking Details.
          </p>
        </div>
      )}
    </div>
  );
}

function App() {
  const [tripDetails, setTripDetails] = useState({});
  const [selectedCar, setSelectedCar] = useState(null);
  const [totalFare, setTotalFare] = useState(0);

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
