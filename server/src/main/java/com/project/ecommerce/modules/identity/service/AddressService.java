package com.project.ecommerce.modules.identity.service;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.identity.dto.request.CreateAddressRequest;
import com.project.ecommerce.modules.identity.dto.request.UpdateAddressRequest;
import com.project.ecommerce.modules.identity.dto.response.AddressResponse;
import com.project.ecommerce.modules.identity.entity.Address;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.mapper.AddressMapper;
import com.project.ecommerce.modules.identity.repository.AddressRepository;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AddressService {
    AddressRepository addressRepository;
    UserRepository userRepository;
    AddressMapper addressMapper;

    @PreAuthorize("isAuthenticated()")
    public AddressResponse createAddress(String userId, CreateAddressRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (request.isDefaultAddress()) {
            addressRepository.findByUserId(userId).forEach(addr -> {
                addr.setDefaultAddress(false);
                addressRepository.save(addr);
            });
        }

        Address address = addressMapper.toAddress(request);
        address.setUser(user);
        return addressMapper.toResponse(addressRepository.save(address));
    }

    @PreAuthorize("isAuthenticated()")
    public List<AddressResponse> getUserAddresses(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        return addressRepository.findByUserId(userId)
                .stream()
                .map(addressMapper::toResponse)
                .toList();
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    public List<AddressResponse> getAddressesForAdmin(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        return addressRepository.findByUserId(userId)
                .stream()
                .map(addressMapper::toResponse)
                .toList();
    }

    @PreAuthorize("isAuthenticated()")
    public AddressResponse getAddressById(String userId, String addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        return addressMapper.toResponse(address);
    }

    @PreAuthorize("isAuthenticated()")
    public AddressResponse updateAddress(String userId, String addressId, UpdateAddressRequest request) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        // If marked as default, unset other addresses as default
        if (request.isDefaultAddress() && !address.isDefaultAddress()) {
            addressRepository.findByUserId(userId).forEach(addr -> {
                if (!addr.getId().equals(addressId)) {
                    addr.setDefaultAddress(false);
                    addressRepository.save(addr);
                }
            });
        }

        addressMapper.updateAddress(address, request);
        return addressMapper.toResponse(addressRepository.save(address));
    }

    @Transactional
    @PreAuthorize("isAuthenticated()")
    public void deleteAddress(String userId, String addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        address.setIsDeleted(true);
        addressRepository.save(address);
    }
}
