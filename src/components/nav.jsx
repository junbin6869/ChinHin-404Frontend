import { NavLink } from "react-router-dom";
import Logo from "../assets/Logo.png";
import "../App.css";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [email, setEmail] = useState("Loading...");
  const cls = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;
/*
  //Run when the page loaded
  useEffect(()=>{
    //
    async function loadGmail(){
      try{
        const res = await callBackend("/");
        if(!res.ok) throw new Error(`Error: ${res.status}`);
        const gmail = await res.json();
        setEmail(gmail.email ?? "user");
      }
      catch(error){
        console.error("Failed to load:", error);
        setEmail("Guest");
      }
    }

    loadGmail();
  },[]);
*/


  return (
    <nav className="navbar">
      <div className="navbar-left">
        <NavLink to = "/">
          <img src={Logo} alt="logo" className="nav-logo" />
        </NavLink>
      </div>
      <ul className="navbar-menu">
        <li>
          <NavLink to="/copilot" className={cls}>Copilot</NavLink>
        </li>
        <li>
          <NavLink to="/insight" className={cls}>Insight</NavLink>
        </li>
      </ul>


      <div className="navbar-right">
        <span className="username">{email}</span>
      </div>
    </nav>
  );
}
