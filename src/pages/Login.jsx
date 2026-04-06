import AuthLayout from '@layouts/AuthLayout';
import MainLayout from '@layouts/MainLayout';
import LoginForm from '@components/forms/LoginForm';

export default function Login() {
    return (
        <MainLayout>
            <AuthLayout>
                <LoginForm />
            </AuthLayout>
        </MainLayout>
    );
}
