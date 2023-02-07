/* eslint-disable max-lines-per-function */
/* eslint-disable spaced-comment */
/**
 * 로그인 페이지
 * 로그인 상세기능 구현은 /api/Users.js 참고
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { setRefreshToken } from '../storage/Cookies';
import { Link } from 'react-router-dom';

import { loginUser } from '../api/Users';
import { SET_USER } from '../store/User';
import { SET_TOKEN } from '../store/Auth';

import KakaoButton from '../components/buttons/KakaoButton';
import NaverButton from '../components/buttons/NaverButton';
import GoogleButton from '../components/buttons/GoogleButton';
import logo from '../assets/우리끼니로고.png';
import '../styles/LoginPage.css';
import CenterLogo from '../styles/CenterLogo';
import axios from '../../node_modules/axios/index';

const LoginPage = () => {
  //React Hooks
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    register,
    setValue,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm();

  //onSubmit 요청에 동작할 코드
  //Backend로 유저정보를 전달
  const onValid = async ({ userEmail, userPassword }) => {
    //response 객체
    //참고: /api/Users.js
    const data = {
      userEmail,
      userPassword,
    };

    axios({
      url: 'https://i8a804.p.ssafy.io/api/user/login',
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      data,
    })
      .then((response) => {
        //요청 응답이 오면 응답상태를 체크
        //response.status가 true면 응답이 200번대(성공)
        console.log('@@', response);
        if (response.status === 200 || 202) {
          console.log(response.status / 100);
          //Cookie에 Refresh Token 저장
          setRefreshToken(response.data.refreshToken);
          //store에 Access Token 저장하도록 Action Dispatch
          //참고: /store/Auth.js
          dispatch(SET_TOKEN(response.data.accessToken));
          dispatch(SET_USER({ id: response.data.userId, nickname: response.data.userNickname }));
          //화면 이동(메인)
          navigate('/');
        } else {
          window.confirm('로그인 에러');

          navigate('/user/login');
        }
      })
      .catch((err) => {
        console.log('???', err);
      });

    //input폼 비워주는 코드
    setValue('userId', '');
    setValue('userPassword', '');
  };

  const onSignUp = () => {
    navigate('/user/signup');
  };

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="login">
      <div className="logo-box">
        <CenterLogo />
        <h3>같이 밥먹을래?</h3>
      </div>
      <form className="loginform" onSubmit={handleSubmit(onValid)}>
        <div className="inputform">
          <div className="inputs">
            <input
              id="userEmail"
              type="email"
              placeholder="이메일을 입력하세요"
              {...register('userEmail', {
                required: '이메일은 필수 입력사항입니다.',
                pattern: {
                  value: /\S+@\S+\.\S+/, //정규식
                  message: '이메일이 형식에 맞지 않습니다.',
                },
              })}
            />
            {errors.email && <small role="alert">{errors.email.message}</small>}
            <input
              id="userPassword"
              type="password"
              placeholder="비밀번호를 입력하세요"
              {...register('userPassword', {
                minLength: {
                  value: 8,
                  message: '8자리 이상 비밀번호를 사용해주세요.',
                },
              })}
            />
            {errors.password && <small role="alert">{errors.password.message}</small>}
          </div>

          <button className="loginButton" type="submit" disabled={isSubmitting}>
            로그인
          </button>
        </div>

        <button className="signUpButton" onClick={onSignUp}>
          회원가입
        </button>
        <Link
          to="FindPassword"
          style={{ color: 'blue', textDecoration: 'none', textAlign: 'right', marginRight: '50px', padding: '5px' }}
        >
          <small>비밀번호 찾기</small>
        </Link>
        <div className="socialLogin">
          <NaverButton />
          <KakaoButton />
          <GoogleButton />
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
