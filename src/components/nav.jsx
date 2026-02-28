import { NavLink, useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import "../App.css";
import { getRole, isAuthed, clearAuth } from "../auth";

export default function Navbar() {
  const navigate = useNavigate();
  const role = getRole();

  const cls = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

  function logout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <NavLink to="/">
          <img src={Logo} alt="logo" className="nav-logo" />
        </NavLink>
      </div>

      <ul className="navbar-menu">
        <li><NavLink to="/copilot" className={cls}>Copilot</NavLink></li>
        <li><NavLink to="/insight" className={cls}>Insight</NavLink></li>
      </ul>

      <div className="navbar-right">
        {isAuthed() ? (
          <>
            <span className="username">{role}</span>
            <button className="btn btn-outline" onClick={logout} style={{ marginLeft: 12 }}>Logout</button>
          </>
        ) : (
          <button className="btn btn-outline" onClick={() => navigate("/login")}>Login</button>
        )}
      </div>
    </nav>
  );
}