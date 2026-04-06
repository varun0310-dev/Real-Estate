export default function AuthLayout({ children }) {
    return (
        <div className=" min-h-[600px] flex items-center justify-center ">
            <div className="bg-white p-4 md:p-8 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] w-full max-w-md">
                {children}
            </div>
        </div>
    );
}
