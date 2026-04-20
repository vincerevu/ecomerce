import React, { useState } from "react";
import toast from "react-hot-toast";
import CustomDropdown from "../Common/CustomDropdown";

const EditOrder = ({ order, toggleModal }: any) => {
  const [currentStatus, setCurrentStatus] = useState(order?.status);

  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (!currentStatus) {
      toast.error("Please select a status");
      return;
    }

    toggleModal(false);
  };

  return (
    <div className="w-full px-10">
      <p className="pb-2 font-medium text-dark">Order Status</p>
      <div className="w-full">
        <CustomDropdown
          value={currentStatus}
          onChange={(nextValue) => setCurrentStatus(nextValue)}
          options={[
            { label: "Processing", value: "processing" },
            { label: "On Hold", value: "on-hold" },
            { label: "Delivered", value: "delivered" },
            { label: "Cancelled", value: "cancelled" },
          ]}
          buttonClassName="rounded-[10px] bg-gray-1 py-3.5 text-custom-sm"
        />

        <button
          className="mt-5 w-full rounded-[10px] border border-blue-1 bg-blue-1 text-white py-3.5 px-5 text-custom-sm bg-blue"
          onClick={handleSubmit}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditOrder;
