import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import AuthForm from '../components/AuthForm';

const LoginPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  console.log('User in LoginPage:', user); // Add this for debugging

  if (user) {
    navigate(user.role === 'admin' ? '/admin' : '/staff', { replace: true });
    return null;
  }

  return (
    <div>
      <AuthForm isLogin={true} />
    </div>
  );
};

export default LoginPage;