import MainLayout from '@layouts/MainLayout';
import AuthLayout from '@layouts/AuthLayout';
import RegisterForm from '@components/forms/RegisterForm';

export default function Register() {
    return (
        <MainLayout>
            <AuthLayout>
                <RegisterForm />
            </AuthLayout>
        </MainLayout>
    );
}
