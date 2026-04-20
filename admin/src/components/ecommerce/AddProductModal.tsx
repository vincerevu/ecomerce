import React, { useState } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import NumberInput from "../form/input/NumberInput";
import Select from "../form/Select";
import Button from "../ui/button/Button";
import ImageUpload from "../common/ImageUpload";

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [productName, setProductName] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const handleSave = () => {
        // In a real app, you would send this to an API
        console.log("Saving product:", { productName, price, stock, description, imageUrl });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] w-full p-5 lg:p-8">
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                    Add New Product
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Fill out the product information below.
                </p>
            </div>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                        id="productName"
                        placeholder="e.g. Apple iPhone 15 Pro"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <Label>Category</Label>
                        <Select
                            options={[
                                { value: "electronics", label: "Electronics" },
                                { value: "audio", label: "Audio" },
                                { value: "accessories", label: "Accessories" },
                            ]}
                            onChange={(value) => console.log(value)}
                            placeholder="Select Category"
                        />
                    </div>
                    <div>
                        <div>
                            <Label htmlFor="price">Price ($)</Label>
                            <NumberInput
                                id="price"
                                placeholder="0.00"
                                value={price}
                                step={0.01}
                                min={0}
                                onChange={(value) => setPrice(String(value))}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <div>
                            <Label htmlFor="stock">Initial Stock</Label>
                            <NumberInput
                                id="stock"
                                placeholder="0"
                                value={stock}
                                step={1}
                                min={0}
                                onChange={(value) => setStock(String(value))}
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Status</Label>
                        <Select
                            options={[
                                { value: "in-stock", label: "In Stock" },
                                { value: "low-stock", label: "Low Stock" },
                                { value: "out-of-stock", label: "Out of Stock" },
                            ]}
                            onChange={(value) => console.log(value)}
                            placeholder="Select Status"
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <textarea
                        id="description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        placeholder="Product details..."
                    />
                </div>

                <div>
                    <Label>Product Image</Label>
                    <ImageUpload value={imageUrl} onChange={setImageUrl} />
                </div>


                <div className="flex items-center justify-end gap-3 mt-6">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        Save Product
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddProductModal;
