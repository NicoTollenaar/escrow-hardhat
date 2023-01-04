import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <>
      <div className="bg-sky-500/75 m-2 flex-row flex justify-between">
        <NavLink
          to="/"
          className="text-white text-3xl font-bold hover:text-red-500 m-8 inline-block"
          style={({ isActive }) => (isActive ? { color: "red" } : undefined)}
        >
          DvP Escrow
        </NavLink>
        <div className="flex flex-row justify-evenly">
          <NavLink
            to="/submit-transaction"
            className="text-white text-xl font-bold hover:text-red-500 active:text-red-500 m-8 my-8"
            style={({ isActive }) => (isActive ? { color: "red" } : undefined)}
          >
            Submit transaction
          </NavLink>
          <NavLink
            to="/overview-transactions"
            className="text-white text-xl font-bold hover:text-red-500 active:text-red-500 m-8 my-8"
            style={({ isActive }) => (isActive ? { color: "red" } : undefined)}
          >
            Overview transactions
          </NavLink>
          <NavLink
            to="login"
            className="text-white text-xl font-bold hover:text-red-500 m-8 active:text-red"
            style={({ isActive }) => (isActive ? { color: "red" } : undefined)}
          >
            Login
          </NavLink>
          <NavLink
            to="signup"
            className="text-white text-xl font-bold hover:text-red-500 m-8"
            style={({ isActive }) => (isActive ? { color: "red" } : undefined)}
          >
            Signup
          </NavLink>
        </div>
      </div>
    </>
  );
}

export default Navbar;
