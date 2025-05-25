import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import AuthForm from '../components/AuthForm';

const LoginPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

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