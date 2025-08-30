import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/">
        <p className="text-2xl  font-bold text-gradient">RESUMER</p>
      </Link>
      <Link to="/upload" className="primary-button w-fit">
        upload Resume
      </Link>
    </nav>
  );
};

export default Navbar;
