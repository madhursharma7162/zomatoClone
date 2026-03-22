import axios from "axios";
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; // Added useNavigate
import { utilsService } from "../main";
import toast from "react-hot-toast";
import { BiLoader } from "react-icons/bi";

const OrderSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate(); // Initialize navigate
  const sessionId = params.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) return;

      try {
        // 1. Verify with backend
        await axios.post(`${utilsService}api/payment/stripe/verify`, {
          sessionId,
        });

        toast.success("Payment successful 🎉");

        // 2. Redirect to the unified PaymentSuccess page
        // We pass the sessionId as the paymentId so it displays on the screen
        navigate(`/paymentsuccess/${sessionId}`); 
      } catch (error) {
        toast.error("Stripe verification failed");
        console.log(error);
        // Optionally redirect back to checkout or orders if it fails
        navigate("/orders");
      }
    };

    verifyPayment();
  }, [sessionId, navigate]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <BiLoader size={40} className="animate-spin text-[#e23744]" />
      <h1 className="text-xl font-medium text-gray-600">
        Verifying your payment, please wait...
      </h1>
    </div>
  );
};

export default OrderSuccess;