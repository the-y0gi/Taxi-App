import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import axios from "axios";
import { useDebounce } from "use-debounce";
import { Navigate } from "react-router-dom";
const dummyDistance = 10; // in km
const carOptions = [
  { name: "Mini", type: "Hatchback", rate: 1 },
  { name: "Sedan", type: "Sedan", rate: 2 },
  { name: "SUV", type: "SUV", rate: 3 },
  { name: "Luxury", type: "Luxury", rate: 4 },
];

function Page1({ setTripDetails }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tripType, setTripType] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [debouncedFrom] = useDebounce(from, 500);
  const [debouncedTo] = useDebounce(to, 500);
  const [travelDate, setTravelDate] = useState("");

  const navigate = useNavigate();

  const handleContinue = async () => {
    try {
      const fromCoords = fromSuggestions.find(s => s.display_name === from)?.latlng;
      const toCoords = toSuggestions.find(s => s.display_name === to)?.latlng;

      if (!fromCoords || !toCoords) return alert("Invalid locations selected");

      const res = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${fromCoords.lon},${fromCoords.lat};${toCoords.lon},${toCoords.lat}?overview=false`
      );

      const distanceInKm = res.data.routes[0].distance / 1000;

      setTripDetails({ from, to, tripType, distance: distanceInKm, travelDate });

      navigate("/car-selection");
    } catch (error) {
      alert("Failed to calculate distance. Try again.");
      console.error(error);
    }
  };

  const fetchSuggestions = async (query, setSuggestions) => {
    if (!query) return setSuggestions([]);
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1`
    );
    const options = res.data.map(place => ({
      display_name: place.display_name,
      latlng: { lat: place.lat, lon: place.lon }
    }));
    setSuggestions(options);
  };

  React.useEffect(() => {
    fetchSuggestions(debouncedFrom, setFromSuggestions);
  }, [debouncedFrom]);

  React.useEffect(() => {
    fetchSuggestions(debouncedTo, setToSuggestions);
  }, [debouncedTo]);

  return (

    <div className="container mx-auto p-4 mt-2 max-w-md">
      <label htmlFor="" className="text-xs underline underline-offset-2 decoration-dashed font-semibold">Pick-up Location?</label>
      <input
        placeholder="From"
        className="input"
        value={from}
        onChange={e => setFrom(e.target.value)}
        list="fromOptions"
      />
      <datalist id="fromOptions">
        {fromSuggestions.map((item, idx) => (
          <option key={idx} value={item.display_name} />
        ))}
      </datalist>
      <label htmlFor="" className="text-xs underline underline-offset-2 decoration-dashed font-semibold">Where are you going?</label>
      <input
        placeholder="To"
        className="input mt-2"
        value={to}
        onChange={e => setTo(e.target.value)}
        list="toOptions"
      />
      <datalist id="toOptions">
        {toSuggestions.map((item, idx) => (
          <option key={idx} value={item.display_name} />
        ))}
      </datalist>

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
      <label htmlFor="travelDate" className="text-xs  font-semibold">Date of Travel</label>
      <input
        type="date"
        id="travelDate"
        className="input mt-1"
        value={travelDate}
        onChange={(e) => setTravelDate(e.target.value)}
      />


      {from && to && tripType && travelDate && (
        <div className="flex justify-end ">
          <button className="btn mt-4" onClick={handleContinue}>
            Select Car   <i class="icofont-rounded-right"></i>
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
      <p className="font-semibold">Distance: {tripDetails.distance.toFixed(0)} km</p>
      <select className="input mt-1" onChange={e => handleCarSelect(JSON.parse(e.target.value))}>
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
            Total Fare: ₹{Math.floor(selected.rate * tripDetails.distance * (tripDetails.tripType === "two-way" ? 2 : 1))}
          </p>
          <button className="btn mt-4" onClick={() => navigate("/summary")}>Confirm Booking</button>
        </>
      )}
    </div>
  );
}

function Page3({ tripDetails, selectedCar, totalFare }) {
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState();
  function formatTravelDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr; // Invalid date fallback

    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    // Format using locale-aware method
    return date.toLocaleDateString('en-GB', options);
  }

useEffect(() => {
  if (!tripDetails || !selectedCar || totalFare == null) return;
  if (paymentDetails) return; // ensure only one call

  axios.post("http://localhost:4000/api/booking", {
    to: tripDetails.to,
    from: tripDetails.from,
    trip: tripDetails.tripType,
    carName: selectedCar.name,
    rate: selectedCar.rate,
    distance: tripDetails.distance,
    tripDate: tripDetails.travelDate,
    totalFare: totalFare.toFixed(0),
  })
  .then(response => {
    setPaymentDetails(response.data);
  })
  .catch(console.error);
}, [tripDetails, selectedCar, totalFare, paymentDetails]);

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

      <p className="border-b py-2 border-gray-400 font-semibold">To: {tripDetails.to}</p>
      <p className="border-b py-2 border-gray-400 font-semibold">Trip: {tripDetails.tripType}</p>
      <p className="border-b py-2 border-gray-400 font-semibold">Car: {selectedCar.name}</p>
      <p className="border-b py-2 border-gray-400 font-semibold">Rate: ₹{selectedCar.rate}/km</p>
      <p className="border-b py-2 border-gray-400 font-semibold">Distance: {tripDetails.distance.toFixed(0)} km</p>
      <p className="border-b py-2 border-gray-400 font-semibold">Date of Travel: {formatTravelDate(tripDetails.travelDate)}</p>
      <p className=" py-2 border-gray-400 font-semibold">Total Fare: ₹{totalFare.toFixed(0)}</p>
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
      fontWeight: 600
    }}
  >
    {item?.label}:
    <span>{item?.value}</span>
  </p>
))}

      <button className="btn mt-4" onClick={() => navigate("/login")}>Confirm Booking</button>
    </div>
  );
}

function Page4() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const handleLogin = () => {
    setOtpSent(true);
    alert("OTP sent to email: 123456");
  };

  const verifyOtp = () => {
    if (otp === "123456") alert("Booking Successful!");
    else alert("Invalid OTP");
  };

  return (
    <div className="container p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Login to Confirm</h2>
      <input placeholder="Email" className="input" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" className="input mt-2" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button className="btn flex justify-center mt-4" onClick={handleLogin}>Login</button>
      {otpSent && (
        <div className="mt-4">
          <input placeholder="Enter OTP" className="input" value={otp} onChange={e => setOtp(e.target.value)} />
          <button className="btn mt-2" onClick={verifyOtp}>Verify OTP</button>
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
        <h2 className="text-3xl pt-10 font-bold mb-1">Car hire for any kind of trip</h2>
        <p className="text-lg mb-4 font-semibold">Great cars at great prices, from the biggest car rental companie</p>
      </div>
      <Router>
        <Routes>
          <Route path="/" element={<Page1 setTripDetails={setTripDetails} />} />
          <Route path="/car-selection" element={<Page2 tripDetails={tripDetails} setSelectedCar={setSelectedCar} setTotalFare={setTotalFare} />} />
          <Route path="/summary" element={<Page3 tripDetails={tripDetails} selectedCar={selectedCar} totalFare={totalFare} />} />
          <Route path="/login" element={<Page4 />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;