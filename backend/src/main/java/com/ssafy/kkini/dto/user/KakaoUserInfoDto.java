package com.ssafy.kkini.dto.user;

import java.util.Date;
import java.util.Map;

public class KakaoUserInfoDto implements OAuth2UserInfoDto {

    private Map<String, Object> attributes;
    private Map<String, Object> kakaoAccount;
    private Map<String, Object> kakaoProfile ;

    public KakaoUserInfoDto(Map<String, Object> attributes) {
        this.attributes = attributes;
        this.kakaoAccount = (Map) attributes.get("kakao_account");
        this.kakaoProfile = (Map) kakaoAccount.get("profile");
    }

    @Override
    public String getEmail() {
        return (String) kakaoAccount.get("email");
    }

    @Override
    public String getNickName() {
        return (String) kakaoProfile.get("nickname");
    }

    @Override
    public String getName() {
        return null;
    }

    @Override
    public int getBirthYear() {
        return  0;
    }

    @Override
    public String getGender() {
        return (String) kakaoAccount.get("gender").toString().toUpperCase().substring(0,1);
    }

    @Override
    public String getProviderId() {
        return (String) attributes.get("id").toString();
    }

    @Override
    public String getProvider() {
        return "kakao";
    }
}