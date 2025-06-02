import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import {
  isValidEmail,
  isValidPassword,
  validationMessages,
} from "../utils/validation";
import AdminLogin from '../components/AdminLogin';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = validationMessages.email.required;
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = validationMessages.email.invalid;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = validationMessages.password.required;
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = validationMessages.password.invalid;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({
        ...formData,
        email: formData.email.toLowerCase(),
      });

      if (response.token) {
        // Store authentication data
        localStorage.setItem("token", response.token);
        localStorage.setItem("userData", JSON.stringify(response.user));
        localStorage.setItem("userType", response.user.role || "student");
        localStorage.setItem("userId", response.user.id); // Use id instead of userId

        const dashboardPath =
          response.user.role === "supervisor"
            ? "/supervisor-dashboard"
            : "/user-dashboard";

        navigate(dashboardPath, { replace: true });
      } else {
        setErrors({ submit: "Login failed. Please try again." });
      }
    } catch (err) {
      setErrors({
        submit: err.response?.data?.message || "Invalid email or password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#592538] p-12 flex-col justify-between">
        <div>
          <div className="flex items-center space-x-4">
            <Link to="/">
              <img
                src="/eduSoft_logo.png"
                alt="EduSoft Logo"
                className="h-12 w-auto"
              />
            </Link>
            <Link to="/">
              <img src="/logo-02.png" alt="ASPU Logo" className="h-12 w-auto" />
            </Link>
            <span className="text-[#F7F4F3] text-3xl font-bold">EduSoft</span>
          </div>
          <div className="mt-16">
            <h2 className="text-[#F7F4F3] text-4xl font-light leading-tight">
              Your personalized learning
              <br />
              journey continues here.
            </h2>
            <p className="text-[#F7F4F3]/80 text-xl mt-6 leading-relaxed">
              Log in to access your soft
              <br />
              skills assessments, track
              <br />
              progress, and discover
              <br />
              tailored resources to help you
              <br />
              excel.
            </p>
          </div>
          <Link to="/" className="block w-fit">
            <button className="mt-8 px-8 py-3 bg-white text-[#5B2333] rounded-full text-lg font-medium hover:bg-gray-100 transition-colors">
              Read More
            </button>
          </Link>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-[#592538] rounded-2xl p-8 w-full">
            <h1 className="text-[#F7F4F3] text-3xl font-bold mb-2">
              Welcome Back!
            </h1>
            <p className="text-[#F7F4F3]/70 mb-8">
              Choose one of the option to go
            </p>

            {errors.submit && (
              <div className="mb-4 p-3 rounded bg-red-100/10">
                <p className="text-red-200 text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="flex justify-center gap-4 mb-6">
              <button
                type="button"
                className={`px-4 py-2 rounded-full font-medium transition-colors ${!isAdmin ? 'bg-white text-[#592538]' : 'bg-[#F7F4F3]/20 text-white'}`}
                onClick={() => setIsAdmin(false)}
              >
                Student
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-full font-medium transition-colors ${isAdmin ? 'bg-white text-[#592538]' : 'bg-[#F7F4F3]/20 text-white'}`}
                onClick={() => setIsAdmin(true)}
              >
                Admin
              </button>
            </div>

            {isAdmin ? (
              <AdminLogin />
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Mohammad@asu.com"
                    className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-200">{errors.email}</p>
                  )}
                </div>

                <div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  {errors.password && (
                    <div className="flex items-center gap-2 mt-1 p-2 bg-red-50 border border-red-200 rounded">
                      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>
                      <span className="text-sm text-red-700">{errors.password}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-white/80 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-[#5B2333] rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  {loading ? "Signing in..." : "Log in"}
                </button>

                <div className="text-center text-[#F7F4F3]">
                  <span className="opacity-70">Don't have account? </span>
                  <Link
                    to="/signup"
                    className="font-medium text-[#F7F4F3] hover:underline"
                  >
                    Sign up now
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
