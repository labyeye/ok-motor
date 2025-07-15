import { useContext ,useState} from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import AuthForm from "../components/AuthForm";

const LoginPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(true);

  if (user) {
    navigate(user.role === "admin" ? "/admin" : "/staff");
    return null;
  }

  return (
    <div>
      {showLogin ? <AuthForm isLogin={true} /> : <AuthForm isLogin={false} />}
      <button onClick={() => setShowLogin(!showLogin)}>
        {showLogin ? "Need to register?" : "Already have an account?"}
      </button>
    </div>
  );
};

export default LoginPage;
