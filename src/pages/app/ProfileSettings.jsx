// frontend/src/pages/app/ProfileSettings.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  FileText,
  Camera,
  Save,
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  Link as LinkIcon
} from "lucide-react";
import { getProfileAPI, updateProfileAPI, uploadProfilePicAPI, updatePasswordAPI } from "../../api/user";

export default function ProfileSettings() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    country: "",
    city: "",
    address: "",
    website: "",
    birthDate: "",
    gender: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Fetch user data
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userData = await getProfileAPI();
      setUser(userData);
      
      console.log("Profile pic from API:", userData?.profilePic);
      
      let genderString = "";
      if (userData?.gender === 0) genderString = "male";
      else if (userData?.gender === 1) genderString = "female";
      else if (userData?.gender === 2) genderString = "other";
      
      setFormData({
        firstName: userData?.firstName || "",
        lastName: userData?.lastName || "",
        email: userData?.email || "",
        phone: userData?.phone || "",
        bio: userData?.bio || "",
        country: userData?.country || "",
        city: userData?.city || "",
        address: userData?.address || "",
        website: userData?.website || "",
        birthDate: userData?.DOB ? new Date(userData.DOB).toISOString().split("T")[0] : "",
        gender: genderString,
      });
      
      // ✅ إضافة timestamp لمنع caching
      const picUrl = userData?.profilePic;
      if (picUrl) {
        const finalUrl = picUrl.includes('?') ? `${picUrl}&t=${Date.now()}` : `${picUrl}?t=${Date.now()}`;
        setProfilePicPreview(finalUrl);
      } else {
        setProfilePicPreview(null);
      }
      setImgError(false);
      
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Preview using local blob
    const previewUrl = URL.createObjectURL(file);
    setProfilePicPreview(previewUrl);
    setImgError(false);

    setUploadingPic(true);
    try {
      const result = await uploadProfilePicAPI(file);
      if (result.success !== false) {
        toast.success("Profile picture updated!");
        await fetchUserData(); // refetch to get the permanent URL
      } else {
        toast.error(result.message || "Failed to update profile picture");
        // revert preview if needed
        await fetchUserData();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
      await fetchUserData();
    } finally {
      setUploadingPic(false);
      // revoke blob URL after upload to avoid memory leaks
      URL.revokeObjectURL(previewUrl);
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const dataToSend = {};
      
      if (formData.firstName !== user?.firstName) dataToSend.firstName = formData.firstName;
      if (formData.lastName !== user?.lastName) dataToSend.lastName = formData.lastName;
      if (formData.phone !== user?.phone) dataToSend.phone = formData.phone;
      if (formData.bio !== user?.bio) dataToSend.bio = formData.bio;
      if (formData.country !== user?.country) dataToSend.country = formData.country;
      if (formData.address !== user?.address) dataToSend.address = formData.address;
      if (formData.website !== user?.website) dataToSend.website = formData.website;
      if (formData.birthDate !== user?.DOB?.split("T")[0]) dataToSend.DOB = formData.birthDate;
      
      let genderValue = null;
      if (formData.gender === "male") genderValue = 0;
      else if (formData.gender === "female") genderValue = 1;
      else if (formData.gender === "other") genderValue = 2;
      
      if (genderValue !== user?.gender) dataToSend.gender = genderValue;
      
      if (Object.keys(dataToSend).length === 0) {
        toast("No changes to save", {
          icon: 'ℹ️',
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        });
        setLoading(false);
        return;
      }
      
      const result = await updateProfileAPI(dataToSend);
      
      if (result.success !== false) {
        toast.success("Profile updated successfully!");
        await fetchUserData();
      } else {
        toast.error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await updatePasswordAPI({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmPassword,
      });
      
      if (result.success !== false) {
        toast.success("Password updated successfully!");
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(result.message || "Failed to update password");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
        <div className="border-4 border-purple-500 border-t-transparent rounded-full w-12 h-12 animate-spin" />
        <p className="mt-4 text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-purple-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse mix-blend-multiply filter"></div>
        <div className="-bottom-40 -left-40 absolute bg-blue-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse delay-1000 mix-blend-multiply filter"></div>
        <div className="top-1/2 left-1/2 absolute bg-pink-600 opacity-10 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000 transform mix-blend-multiply filter"></div>
      </div>

      <div className="z-10 relative mx-auto p-6 max-w-4xl">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold text-transparent text-3xl">
              Profile Settings
            </h1>
            <p className="text-gray-400 text-sm">Manage your personal information</p>
          </div>
        </motion.div>

        <div className="flex gap-2 mb-8 pb-4 border-white/10 border-b">
          {[
            { id: "profile", label: "Profile Info", icon: User },
            { id: "password", label: "Password", icon: Lock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl mb-6 p-6 border border-white/10 rounded-2xl"
        >
          <div className="flex sm:flex-row flex-col items-center gap-6">
            <div className="relative">
              <div className="flex justify-center items-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-full w-24 h-24 overflow-hidden">
                {profilePicPreview && !imgError ? (
                  <img 
                    src={profilePicPreview} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <User size={40} className="text-white" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPic}
                className="-right-2 -bottom-2 absolute bg-purple-500 hover:bg-purple-600 disabled:opacity-50 p-1.5 rounded-full transition-all duration-200"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePicUpload}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Profile Picture</h3>
              <p className="text-gray-400 text-sm">Click the camera icon to change your profile picture</p>
              {uploadingPic && (
                <div className="flex items-center gap-2 mt-2 text-purple-400 text-sm">
                  <div className="border-2 border-purple-400 border-t-transparent rounded-full w-4 h-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Basic Info */}
            <div className="bg-white/5 backdrop-blur-xl p-6 border border-white/10 rounded-2xl">
              <h2 className="flex items-center gap-2 mb-4 font-semibold text-xl">
                <User size={20} />
                Basic Information
              </h2>
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="block mb-2 font-medium text-gray-300 text-sm">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full text-white transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-300 text-sm">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full text-white transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-300 text-sm">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-black/40 opacity-60 px-4 py-2 border border-white/10 rounded-xl w-full text-white cursor-not-allowed"
                  />
                  <p className="mt-1 text-gray-500 text-xs">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-300 text-sm">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full text-white transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-300 text-sm">Birth Date</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full text-white transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-300 text-sm">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full text-white transition-all duration-200"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white/5 backdrop-blur-xl p-6 border border-white/10 rounded-2xl">
              <h2 className="flex items-center gap-2 mb-4 font-semibold text-xl">
                <MapPin size={20} />
                Location
              </h2>
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="block mb-2 font-medium text-gray-300 text-sm">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g., Egypt"
                    className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full text-white transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-300 text-sm">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g., Cairo"
                    className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full text-white transition-all duration-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium text-gray-300 text-sm">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Your address"
                    className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full text-white transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white/5 backdrop-blur-xl p-6 border border-white/10 rounded-2xl">
              <h2 className="flex items-center gap-2 mb-4 font-semibold text-xl">
                <FileText size={20} />
                About Me
              </h2>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                placeholder="Tell us about yourself..."
                className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full text-white transition-all duration-200 resize-none"
              />
              <p className="mt-1 text-gray-500 text-xs">Max 500 characters</p>
            </div>

            {/* Website */}
            <div className="bg-white/5 backdrop-blur-xl p-6 border border-white/10 rounded-2xl">
              <h2 className="flex items-center gap-2 mb-4 font-semibold text-xl">
                <LinkIcon size={20} />
                Website
              </h2>
              <div>
                <label className="block mb-2 font-medium text-gray-300 text-sm">Website URL</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                  className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full text-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Save Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={updateProfile}
              disabled={loading}
              className="flex justify-center items-center gap-2 bg-gradient-to-r from-purple-500 hover:from-purple-600 to-pink-500 hover:to-pink-600 disabled:opacity-50 py-3 rounded-xl w-full font-semibold transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {activeTab === "password" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl p-6 border border-white/10 rounded-2xl"
          >
            <h2 className="flex items-center gap-2 mb-4 font-semibold text-xl">
              <Lock size={20} />
              Change Password
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-gray-300 text-sm">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full text-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="top-1/2 right-3 absolute text-gray-400 hover:text-white -translate-y-1/2 transform"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-300 text-sm">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (min 6 characters)"
                    className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full text-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="top-1/2 right-3 absolute text-gray-400 hover:text-white -translate-y-1/2 transform"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-300 text-sm">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full text-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="top-1/2 right-3 absolute text-gray-400 hover:text-white -translate-y-1/2 transform"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={updatePassword}
                disabled={loading}
                className="flex justify-center items-center gap-2 bg-gradient-to-r from-cyan-500 hover:from-cyan-600 to-blue-500 hover:to-blue-600 disabled:opacity-50 py-3 rounded-xl w-full font-semibold transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Update Password
                  </>
                )}
              </motion.button>

              <div className="bg-yellow-500/10 mt-4 p-3 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-2 text-yellow-400 text-xs">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="mb-1 font-semibold">Password Requirements:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Minimum 6 characters long</li>
                      <li>Should be different from current password</li>
                      <li>Keep your password secure</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}