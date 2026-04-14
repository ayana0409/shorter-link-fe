import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { post } from "../../utils/request";
import toast from "react-hot-toast";
import { setTokenWithExpiry, getTokenWithExpiry } from "../../constants/localStorage";

const Login = () => {
    const [user, setUser] = useState({
        username: '',
        password: ''
    });

    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from || '/home';
    const isAuthenticated = Boolean(getTokenWithExpiry());

    useEffect(() => {
        if (isAuthenticated) {
            navigate(redirectTo, { replace: true });
        }
    }, [isAuthenticated, navigate, redirectTo]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/auth/login', user)
            .then(res => {
                setTokenWithExpiry(res.access_token, res.expires_in * 1000);
                toast.success('Login successfully');
                navigate(redirectTo, { replace: true });
            })
            .catch(err => {
                const message = err.response?.data?.message || 'An unexpected error occurred';
                toast.error(message);
            });
    }

    if (isAuthenticated) {
        return null;
    }


    const handleChange = (e) => {
        setUser({
            ...user,
            [e.target.name]: e.target.value
        });
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-center">LOGIN</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700">Username:</label>
                        <input
                            type="text"
                            name="username"
                            value={user.username}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Password:</label>
                        <input
                            type="password"
                            name="password"
                            value={user.password}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;