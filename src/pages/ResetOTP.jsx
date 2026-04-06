import MainLayout from '@layouts/MainLayout';
import AuthLayout from '@layouts/AuthLayout';
import ResetOTP from '@components/forms/VerifyOTP';

export default function Register() {
    return (
        <MainLayout>
            <AuthLayout>
                <ResetOTP />
            </AuthLayout>
        </MainLayout>
    );
}
