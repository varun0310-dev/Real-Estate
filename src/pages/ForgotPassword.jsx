import MainLayout from '@layouts/MainLayout';
import AuthLayout from '@layouts/AuthLayout';
import ForgotPasswordForm from '@components/forms/ForgotPasswordForm';

export default function ForgotPassword() {
    return (
        <MainLayout>
            <AuthLayout>
                <ForgotPasswordForm />
            </AuthLayout>
        </MainLayout>
    );
}
