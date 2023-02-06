import React, { Component } from 'react';

import axios from 'axios';
import UserVideoComponent from './UserVideoComponent';
import { OpenVidu } from 'openvidu-browser';

import CenterLogo from '../styles/CenterLogo';
import './UserVideo.css';
import './VideoRoom.css';

const OPENVIDU_SERVER_URL = 'https://i8a804.p.ssafy.io:8443'; //도커에 올린 openvidu server
const OPENVIDU_SERVER_SECRET = 'MY_SECRET'; //시크릿키값, 바꿔주면 좋음

const EncodeBase64 = (data) => {
  return Buffer.from(data).toString('base64');
};

class VideoRoom extends Component {
  //초기설정 생성자
  constructor(props) {
    super(props);

    //state
    this.state = {
      mySessionId: 'SessionA',
      myUserName: 'Participant' + Math.floor(Math.random() * 100),
      session: undefined, //현재 접속해있는 세션
      mainStreamManager: undefined, // 스트림 종합한 페이지의 메인 비디오
      publisher: undefined, //로컬 웹캠 스트림
      subscribers: [], //다른 사용자의 활성 웹캠 스트림
      isEmpty: false, //세션이 비어있는지 아닌지
      isHost: false, //
      token: undefined, //accessToken
      message: '', //메시지 단일입력
      messages: [], //메시지 로그
    };

    //method
    this.joinSession = this.joinSession.bind(this);
    this.leaveSession = this.leaveSession.bind(this);
    this.switchCamera = this.switchCamera.bind(this);
    this.handleChangeSessionId = this.handleChangeSessionId.bind(this);
    this.handleChangeUserName = this.handleChangeUserName.bind(this);
    this.handleMainVideoStream = this.handleMainVideoStream.bind(this);
    this.onbeforeunload = this.onbeforeunload.bind(this);
  }

  //컴포넌트 마운트 직후
  componentDidMount() {
    window.addEventListener('beforeunload', this.onbeforeunload);

    const { roomId, nickName, token } = this.props; //props에서 초기값 물려받기

    this.setState({
      mySessionId: roomId,
      myUserName: nickName,
      token,
    });

    //this.joinSession(); //바로 방입장하려면 이 옵션을 활성화
  }

  //컴포넌트 언마운트 직전
  componentWillUnmount() {
    window.location.reload(); //화면 새로고침
    window.removeEventListener('beforeunload', this.onbeforeunload);
    //세션에 아무도 없으면 퇴장
    if (this.state.isEmpty) {
      this.leaveSession();
    }
  }

  onbeforeunload(event) {
    this.leaveSession();
  }

  //방 이름 폼에 적으면 반영
  handleChangeSessionId(e) {
    this.setState({
      mySessionId: e.target.value,
    });
  }

  //유저 닉네임 폼에 적으면 반영(쓸일 없음)
  handleChangeUserName(e) {
    this.setState({
      myUserName: e.target.value,
    });
  }

  //chat input form 반영
  handleChangeChatMessage(e) {
    this.setState({
      message: e.target.value,
    });
  }

  //클릭해서 채팅보내기
  sendMessageByClick() {
    this.setState({
      messages: [
        ...this.state.messages,
        {
          userName: this.state.myUserName,
          message: this.state.message,
        },
      ],
    });

    const mySession = this.state.session;

    mySession.signal({
      data: `${this.state.myUserName}, ${this.state.message}`, //signal의 실질적 메시지
      to: [], //Session.on('signal')을 subscribe한 참여자들에게 전달됨. []거나 undefined일 경우, 전체 참여자에게 전달됨
      type: 'chat', //signal 타입. Session.on('signal:type') 이벤트를 subscribe한 참여자들에게 전달
    });

    //message창 초기화
    this.setState({
      message: '',
    });
  }

  //엔터쳐서 채팅보내기
  sendMessageByEnter(e) {
    if (e.key === 'Enter') {
      this.setState({
        messages: [
          ...this.state.messages,
          {
            userName: this.state.myUserName,
            message: this.state.message,
          },
        ],
      });

      const mySession = this.state.session;

      mySession.signal({
        data: `${this.state.myUserName}, ${this.state.message}`, //signal의 실질적 메시지
        to: [], //Session.on('signal')을 subscribe한 참여자들에게 전달됨. []거나 undefined일 경우, 전체 참여자에게 전달됨
        type: 'chat', //signal 타입. Session.on('signal:type') 이벤트를 subscribe한 참여자들에게 전달
      });

      //message창 초기화
      this.setState({
        message: '',
      });
    }
  }

  //선택한 화면(stream)을 메인으로 띄우기
  handleMainVideoStream(stream) {
    if (this.state.mainStreamManager !== stream) {
      this.setState({
        mainStreamManager: stream,
      });
    }
  }

  deleteSubscriber(streamManager) {
    let subscribers = this.state.subscribers;
    let index = subscribers.indexOf(streamManager, 0);
    if (index > -1) {
      subscribers.splice(index, 1);
      this.setState({
        subscribers: subscribers,
      });
    }
  }

  //현재 세션의 참가자 정보 획득
  updateHost() {
    return new Promise((resolve, reject) => {
      axios({
        method: 'GET',
        url: `${'https://i8a804.p.ssafy.io:8443/api/sessions/'}${this.state.mySessionId}/connection`,
        headers: {
          Authorization: `Basic ${btoa(`OPENVIDUAPP:${OPENVIDU_SERVER_SECRET}`)}`,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST',
        },
      })
        .then((response) => {
          let content = response.content;
          content.sort((a, b) => a.createdAt - b.createdAt);
          resolve(content[0].clientData);
        })
        .catch((error) => reject(error));
    });
  }

  //submit버튼을 클릭하면 방(세션)에 참여
  joinSession() {
    // --- 1) OpenVidu 객체 호출 ---
    this.OV = new OpenVidu();

    // --- 2) 세션 초기화 ---
    this.setState(
      {
        session: this.OV.initSession(),
      },
      //관심있는 세션 이벤트 구독(subscribe)
      () => {
        let mySession = this.state.session;

        // session객체가 각각 새로운 stream을 구독후,
        // 반환된 구독자 객체를 subscribers에 저장함으로써 상태값 업데이트
        mySession.on('streamCreated', (event) => {
          let newSubscriber = mySession.subscribe(event.stream, JSON.parse(event.stream.connection.data).clientData);
          let newSubscribers = this.state.subscribers;
          newSubscribers.push(newSubscriber);

          this.setState({
            subscribers: [...newSubscribers],
          });

          console.log('subscribers ' + this.subscribers); //등록 확인용
        });

        mySession.on('signal:chat', (event) => {
          let chatdata = event.data.split(','); //위에서 송신한 `${this.state.myUserName}, ${this.state.message}`를 분리

          if (chatdata[0] !== this.state.myUserName) {
            this.setState({
              messages: [
                ...this.state.messages,
                {
                  userName: chatdata[0],
                  text: chatdata[1],
                },
              ],
            });
          }
        });

        //사용자가 화상회의를 떠나면 Session객체에서 소멸된 stream을 받아와
        //subscribers 상태값 업데이트
        mySession.on('streamDestroyed', (event) => {
          this.updateHost().then((clientData) => {
            const host = JSON.parse(clientData).clientData;

            mySession
              .signal({
                data: host,
                to: [],
                type: 'update-host',
              })
              .then(() => {})
              .catch((error) => {});
          });

          // subscribers 배열에서 스트림을 제거합니다
          this.deleteSubscriber(event.stream.streamManager);
        });

        mySession.on('signal:update-host', (event) => {
          if (this.state.userName === event.data) {
            this.setState({
              isHost: true,
            });
          }
        });

        // 모든 비동기 오류마다 Session 객체에 의해 트리거 되는 이벤트
        mySession.on('exception', (exception) => {
          console.warn(exception);
        });

        // --- 유효한 유저 토큰을 가지고 세션에 연결하기 ---

        // OpenVidu 환경에서 토큰 발급받기
        this.getToken().then((token) => {
          // First param is the token got from the OpenVidu deployment. Second param can be retrieved by every user on event
          // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
          mySession
            .connect(token, { clientData: this.state.myUserName })
            .then(async () => {
              this.OV.getUserMedia({
                audioSource: false,
                videoSource: undefined,
                resolution: '640x480',
                frameRate: 30,
              }).then((mediaStream) => {
                let videoTrack = mediaStream.getVideoTracks()[0];

                let newPublisher = this.OV.initPublisher(this.state.myUserName, {
                  audioSource: undefined,
                  videoSource: videoTrack,
                  publishAudio: true,
                  publishVideo: true,
                  insertMode: 'APPEND',
                  mirror: true,
                });

                mySession.publish(newPublisher);
                this.setState({
                  mainStreamManager: newPublisher,
                  publisher: newPublisher,
                });
              });
            })
            .catch((error) => {
              console.log('세션연결 오류:', error.code, error.message);
            });
        });
      },
    );
  }

  //방(세션) 떠나기
  leaveSession() {
    // --- Disconnect 메소드를 호출하면 세션 나가기 ---
    // 현재 세션
    const mySession = this.state.session;

    //mysession이 있을 경우 disconnect메소드 호출
    if (mySession) {
      mySession.disconnect();
    }

    //백엔드에 퇴장 요청 보내기
    axios
      .put('/rooms', {
        roomId: this.state.mySessionId,
      })
      .then(() => {
        // 모든 속성(프로퍼티) 초기화
        this.OV = null; //Openvidu 객체 삭제
        this.setState({
          session: undefined,
          subscribers: [],
          mySessionId: 'SessionA',
          myUserName: 'Participant' + Math.floor(Math.random() * 100),
          mainStreamManager: undefined,
          publisher: undefined,
        });

        this.props.history.push('/');
      });
  }

  async switchCamera() {
    try {
      const devices = await this.OV.getDevices();
      var videoDevices = devices.filter((device) => device.kind === 'videoinput');

      if (videoDevices && videoDevices.length > 1) {
        var newVideoDevice = videoDevices.filter(
          (device) => device.deviceId !== this.state.currentVideoDevice.deviceId,
        );

        if (newVideoDevice.length > 0) {
          var newPublisher = this.OV.initPublisher(undefined, {
            videoSource: newVideoDevice[0].deviceId,
            publishAudio: true,
            publishVideo: true,
            mirror: true,
          });

          await this.state.session.unpublish(this.state.mainStreamManager);

          await this.state.session.publish(newPublisher);
          this.setState({
            currentVideoDevice: newVideoDevice[0],
            mainStreamManager: newPublisher,
            publisher: newPublisher,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    const mySessionId = this.state.mySessionId;
    const myUserName = this.state.myUserName;

    return (
      <div className="container">
        <CenterLogo />
        {this.state.session === undefined ? (
          <div id="join">
            <div id="join-dialog" className="jumbotron vertical-center">
              <h1> 참여하기 </h1>
              <form className="form-group" onSubmit={this.joinSession}>
                <p>
                  <label>참가자명: </label>
                  <input
                    className="form-control"
                    type="text"
                    id="userName"
                    value={myUserName}
                    onChange={this.handleChangeUserName}
                    required
                  />
                </p>
                <p>
                  <label> 세션명: </label>
                  <input
                    className="form-control"
                    type="text"
                    id="sessionId"
                    value={mySessionId}
                    onChange={this.handleChangeSessionId}
                    required
                  />
                </p>
                <p className="text-center">
                  <input className="btn btn-lg btn-success" name="commit" type="submit" value="JOIN" />
                </p>
              </form>
            </div>
          </div>
        ) : null}

        {this.state.session !== undefined ? (
          <div id="session">
            <div id="session-header">
              <h1 id="session-title">{mySessionId}</h1>
              <input
                className="btn btn-large btn-danger"
                type="button"
                id="buttonLeaveSession"
                onClick={this.leaveSession}
                value="Leave session"
              />
            </div>

            {this.state.mainStreamManager !== undefined ? (
              <div id="main-video" className="col-md-6">
                <UserVideoComponent streamManager={this.state.mainStreamManager} />
                <input
                  className="btn btn-large btn-success"
                  type="button"
                  id="buttonSwitchCamera"
                  onClick={this.switchCamera}
                  value="Switch Camera"
                />
              </div>
            ) : null}
            <div id="video-container" className="col-md-6">
              {this.state.publisher !== undefined ? (
                <div
                  className="stream-container col-md-6 col-xs-6"
                  onClick={() => this.handleMainVideoStream(this.state.publisher)}
                >
                  <UserVideoComponent streamManager={this.state.publisher} />
                </div>
              ) : null}
              {this.state.subscribers.map((sub, i) => (
                <div
                  key={i}
                  className="stream-container col-md-6 col-xs-6"
                  onClick={() => this.handleMainVideoStream(sub)}
                >
                  <UserVideoComponent streamManager={sub} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  /**
   * --------------------------------------------
   * GETTING A TOKEN FROM YOUR APPLICATION SERVER
   * --------------------------------------------
   * The methods below request the creation of a Session and a Token to
   * your application server. This keeps your OpenVidu deployment secure.
   *
   * In this sample code, there is no user control at all. Anybody could
   * access your application server endpoints! In a real production
   * environment, your application server must identify the user to allow
   * access to the endpoints.
   *
   * Visit https://docs.openvidu.io/en/stable/application-server to learn
   * more about the integration of OpenVidu in your application server.
   */
  getToken() {
    return this.createSession(this.state.mySessionId).then((sessionId) => {
      this.createToken(sessionId);
    });
  }

  createSession(sessionId) {
    return new Promise((resolve, reject) => {
      let data = JSON.stringify({ customSessionId: sessionId });

      axios
        .post(`${OPENVIDU_SERVER_URL}/openvidu/api/sessions`, data, {
          headers: {
            Authorization: `Basic ${btoa(`OPENVIDUAPP:${OPENVIDU_SERVER_SECRET}`)}`,
            'Content-Type': 'application/json',
          },
        })
        .then((response) => {
          resolve(response.data.id);
        })
        .catch((response) => {
          let error = { ...response };
          if (error.response) {
            if (error.response.status === 409) {
              resolve(sessionId);
            } else if (
              window.confirm(
                `OpenVidu Server와 연결되지 않았습니다. 인증서 오류 일 수도 있습니다. "${OPENVIDU_SERVER_URL}"\n\n 확인해주세요.` +
                  `만약 인증 문제를 찾을 수 없다면, OpenVidu Server가 열려 있는지 확인해주세요`,
              )
            ) {
              window.location.assign(`${OPENVIDU_SERVER_URL}/accept-certificate`);
            }
          }
        });
    });
  }

  createToken(sessionId) {
    return new Promise((resolve, reject) => {
      let data = {};
      axios
        .post(`${OPENVIDU_SERVER_URL}/openvidu/api/sessions/${sessionId}/connection`, data, {
          headers: {
            Authorization: `Basic ${btoa(`OPENVIDUAPP:${OPENVIDU_SERVER_SECRET}`)}`,
            'Content-Type': 'application/json',
          },
        })
        .then((response) => {
          resolve(response.data.token);
        })
        .catch((error) => reject(error));
    });
  }
}

export default VideoRoom;