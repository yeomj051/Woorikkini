import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Room.module.css';
import LockIcon from '@mui/icons-material/Lock';
import axios from 'axios';
import { useSelector } from 'react-redux';

const RoomList = (props) => {
  const roomId = props.room.roomId;
  const title = props.room.roomTitle;
  const content = props.room.roomContent;
  const keywords = props.room.roomKeywordList;
  const limit = props.room.roomLimitUser;
  // const password = props.room.roomPassword;
  const preset = props.room.roomPreset;
  const isPrivate = JSON.parse(props.room.roomPrivate);
  const recent = props.room.roomRecentUser;
  const keywordList = props.keywordList;
  const navigate = useNavigate();
  const [modal, setModal] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const { accessToken } = useSelector((state) => state.token);

  // 임시 지정
  const userId = 1;

  function modalChange() {
    modal ? setModal(false) : setModal(true);
  }

  function goDetail() {
    if (isPrivate) {
      axios({
        url: `https://i8a804.p.ssafy.io/api/room/enter/${roomId}/${userId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          authorization: `Bearer ${accessToken}`,
        },
        data: {
          roomPrivate: isPrivate,
          roomPassword: inputPassword,
        },
      })
        .then((res) => {
          navigate(`${roomId}`);
        })
        .catch((err) => {
          if (err.response.data.message === 'fail') {
            alert('비밀번호가 일치하지 않습니다.');
          } else {
            console.log('goDetail에러', err);
          }
        });
    } else {
      navigate(`${roomId}`);
    }
  }

  return (
    <div
      style={{
        margin: '5%',
        display: 'flex',
        flexFlow: 'wrap row',
        justifyContent: 'center',
      }}
    >
      {' '}
      {modal && (
        <div className={styles.roomEnter}>
          <div className={styles.enterModal}>
            <h2>{title}</h2>
            <pre className={styles.enterContent}>{content}</pre>
            {/* <span className={styles.enterContent}>{content}</span> */}
            {isPrivate && (
              <div
                style={{
                  margin: '30px',
                  marginBottom: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <label style={{ marginRight: '30px', fontSize: '20px' }}>비밀번호</label>
                <input
                  style={{
                    borderRadius: '10px',
                    paddingLeft: '5%',
                    border: 'none',
                    height: '30px',
                    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                  }}
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                />
              </div>
            )}
            <button onClick={goDetail} className={styles.btn}>
              입장하기
            </button>
            <button onClick={modalChange} className={styles.btn} style={{ backgroundColor: '#FF8D89' }}>
              취소하기
            </button>
          </div>
        </div>
      )}
      <div
        onClick={modalChange}
        className={styles[preset]}
        style={{
          cursor: 'pointer',
          width: '90%',
          minHeight: '150px',
          position: 'relative',
        }}
      >
        <h2>{title}</h2>
        {keywords.map((keyword, index) => (
          <span style={{ margin: '1%' }} key={index}>
            # {keywordList[keyword - 1].keyword}
          </span>
        ))}

        <p
          style={{
            position: 'absolute',
            right: '10%',
            bottom: '5%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isPrivate && <LockIcon style={{ fontSize: '90%', marginInline: '20%' }} />}
          {recent}/{limit ? limit : '인원제한'}
        </p>
      </div>
    </div>
  );
};

export default RoomList;