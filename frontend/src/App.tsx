import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import ProphecyDetail from "./pages/ProphecyDetail";
import GraphExplorer from "./pages/GraphExplorer";
import FulfillmentAnalyzer from "./pages/FulfillmentAnalyzer";
import TWOWPredictions from "./pages/TWOWPredictions";
import About from "./pages/About";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/prophecy/:id" element={<ProphecyDetail />} />
        <Route path="/explore" element={<GraphExplorer />} />
        <Route path="/analyze" element={<FulfillmentAnalyzer />} />
        <Route path="/predict" element={<TWOWPredictions />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  );
}

export default App;
