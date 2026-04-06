import React, { useState, useEffect } from "react";

export default function LunarspaceContactForm() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setForm({ name: "", email: "", message: "" });
    };

    useEffect(() => {
        if (submitted) {
            const timer = setTimeout(() => {
                setSubmitted(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [submitted]);

    return (
        <div
            className="w-full mx-auto h-[660px]  md:min-h-screen flex font-sans relative bg-white flex-col md:flex-row  "
        >
            {/* Left Panel */}
            <div
                className="
                    relative hidden md:flex flex-col justify-center items-center
                    w-full md:w-1/2         
                    bg-[#4960B2] text-white p-12 z-10
                    min-h-[320px]           
                "
            >
                {/* Logo */}
                <div className="mb-6 hidden sm:block">
                    <img
                        src="./src/assets/homelogo/formimg.svg"
                        alt="img"
                        className="w-[200px] md:w-[350px] 2xl:w-[600px]" 
                    />
                </div>
                <h2 className="text-lg tracking-widest font-semibold mb-2">WELCOME TO</h2>
                <h1 className="text-3xl font-bold tracking-widest mb-4">Company Name</h1>
                <p className="text-white text-opacity-80 text-center max-w-xs mb-8 text-sm">
                    Reach out to us with your questions, suggestions, or feedback. We’d love to hear from you!
                </p>
            </div>

            {/* SVG Curved Divider */}
            <svg
                className="
                    hidden md:block               
                    absolute left-1/2 top-0 h-full z-20
                "
                style={{ transform: "translateX(-50%)" }}
                width="160"
                height="100%"
                viewBox="0 0 160 900"
                fill="none"
                preserveAspectRatio="none"
            >
                <path
                    d="M160 0C160 0 80 200 80 450C80 700 160 900 160 900L0 900L0 0L160 0Z"
                    fill="#4960B2"
                />
            </svg>

            {/* Right Panel */}
            <div
                className="flex flex-col justify-center items-start w-full md:w-1/2 pl-4 pr-4 py-8 md:pl-24 md:pr-16 md:py-0 z-30 shadow-[0_4px_12px_rgba(0,0,0,0.15)] md:shadow-none
                "
            >
                <form
                    className="
                        w-full max-w-md mx-auto px-4 sm:px-6 md:px-0"
                    onSubmit={handleSubmit}
                >
                    <h2 className="text-2xl font-semibold mb-8 text-center md:text-left">Contact Us</h2>

                    {/* Name */}
                    <div className="mb-6">
                        <label className="block font-bold mb-2 text-sm tracking-wide">NAME</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="ENTER YOUR NAME"
                            className="
                                w-full border-0 border-b-2  border-[#4960B2]
                                outline-none py-2 px-2 bg-transparent
                                text-base placeholder-gray-400
                                focus:ring-0
                            "
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="mb-6">
                        <label className="block font-bold mb-2 text-sm tracking-wide">E-MAIL ADDRESS</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="ENTER YOUR EMAIL"
                            className="
                                w-full border-0 border-b-2 border-[#4960B2]
                                outline-none py-2 px-2 bg-transparent
                                text-base placeholder-gray-400
                                focus:ring-0
                            "
                            required
                        />
                    </div>

                    {/* Message */}
                    <div className="mb-6">
                        <label className="block font-bold mb-2 text-sm tracking-wide">MESSAGE</label>
                        <textarea
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            placeholder="TYPE YOUR MESSAGE"
                            className="
                                w-full rounded-md border-gray-300
                                outline-none py-2 px-2 bg-transparent
                                text-base placeholder-gray-400 resize-none
                                focus:ring-0 border
                            "
                            rows={4}
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            className="
                                bg-[#4960B2] text-white font-bold py-2 px-8 rounded-full
                                transition w-full md:w-auto cursor-pointer
                            "
                        >
                            Send Message
                        </button>
                    </div>

                    {submitted && (
                        <div className="mt-6 text-green-600 font-semibold text-center md:text-left">
                            Thank you for contacting us! We will get back to you soon.
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
