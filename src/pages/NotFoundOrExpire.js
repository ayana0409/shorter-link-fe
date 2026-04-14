
const NotFountOrExpire = () => {
    return (
        <div className="bg-blue-500 text-white p-4 min-h-screen flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
                <h1 className="text-2xl font-bold mb-4">Trang không tồn tại hoặc đã hết hạn!</h1>
                <p className="mb-4">Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.</p>
                <button 
                    className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-gray-100 transition duration-300"
                    onClick={() => window.location.href = '/'}
                >
                    Quay về trang chủ
                </button>
            </div>
        </div>
    );
}

export default NotFountOrExpire;