package com.project.ecommerce.modules.identity.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.identity.dto.response.AddressResponse;
import com.project.ecommerce.modules.identity.entity.Address;
import com.project.ecommerce.modules.identity.mapper.AddressMapper;
import com.project.ecommerce.modules.identity.repository.AddressRepository;
import java.util.List;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AddressServiceTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AddressMapper addressMapper;

    @InjectMocks
    private AddressService addressService;

    @Test
    void deleteAddress_shouldSoftDeleteAddress() {
        Address address = Address.builder()
                .id("address-1")
                .isDeleted(false)
                .build();
        when(addressRepository.findByIdAndUserId("address-1", "user-1")).thenReturn(Optional.of(address));

        addressService.deleteAddress("user-1", "address-1");

        assertThat(address.getIsDeleted()).isTrue();
        verify(addressRepository).save(address);
    }

    @Test
    void getAddressesForAdmin_shouldReturnMappedAddresses() {
        Address address = Address.builder()
                .id("address-1")
                .receiverName("Nguyen Van A")
                .build();
        AddressResponse response = AddressResponse.builder()
                .id("address-1")
                .receiverName("Nguyen Van A")
                .build();

        when(userRepository.existsById("user-1")).thenReturn(true);
        when(addressRepository.findByUserId("user-1")).thenReturn(List.of(address));
        when(addressMapper.toResponse(address)).thenReturn(response);

        List<AddressResponse> result = addressService.getAddressesForAdmin("user-1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("address-1");
    }

    @Test
    void getAddressesForAdmin_shouldThrowWhenUserMissing() {
        when(userRepository.existsById("missing-user")).thenReturn(false);

        assertThatThrownBy(() -> addressService.getAddressesForAdmin("missing-user"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_EXISTED);
    }
}
