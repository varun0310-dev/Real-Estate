import MainLayout from '@layouts/MainLayout';
import AuthLayout from '@layouts/AuthLayout';
import ResetPasswordForm from '@components/forms/ResetPasswordForm';

export default function ResetPassword() {
    return (
        <MainLayout>
            <AuthLayout>
                <ResetPasswordForm />
            </AuthLayout>
        </MainLayout>
    );
}
