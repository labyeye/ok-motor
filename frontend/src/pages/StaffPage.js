import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const StaffPage = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      <h1>Staff Dashboard</h1>
      <p>Welcome {user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default StaffPage;