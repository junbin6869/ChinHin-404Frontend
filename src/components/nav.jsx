import { Link } from "react-router-dom";
import Logo from "../assets/logo.png";
import "../App.css";

export default function Navbar() {
  return (
    <nav className="navbar">
        <div className="navbar-left">
          <img src={Logo} alt="logo" className="nav-logo" />
        </div>

        <ul className="navbar-menu">
            <li>Customer Management</li>
            <li>Project</li>
            <li>Activities</li>
            <li>Issue</li>
            <li>insight</li>
            <li></li>
        </ul>

        <div class="navbar-right">
          <span class="username">junbin@gmail.com</span>
        </div>
    </nav>
  );
}
