const {
       PI,
       sin,
       cos,
       max,
       min,
       abs,
       round,
       floor
} = Math;
Page({
       options: {
              pureDataPattern: /^_\$/
       },
       data: {
              initData: null,
              _$img: null,
              _$deimg: null,
              path: null
       },
       onLoad(e) {
              this.toast();
              var initData = {
                            sys: wx.getSystemInfoSync(),
                            capsule: wx.getMenuButtonBoundingClientRect()
                     },
                     {
                            pixelRatio: dpr,
                            windowWidth: _$pw,
                            windowHeight: _$ph,
                            statusBarHeight: sbh
                     } = initData.sys,
                     cs = initData.capsule,
                     {
                            path,
                            size,
                            type
                     } = JSON.parse(e.data),
                     _$num = typeof size === "number",
                     crop_size = 0.9 * min(_$pw, _$ph),
                     dx = (_$pw - crop_size) / 2,
                     dy = (_$ph - crop_size) / 2,
                     crop_style = `width:${crop_size}px;height:${crop_size}px;left:${dx}px;top:${dy}px;opacity:0`,
                     head_style = `line-height:${cs.bottom -sbh}px;height:${cs.bottom - sbh}px;width:${cs.right + cs.left - _$pw}px;top:${sbh}px`;
              if (["png", "jpg"].indexOf(type) === -1) {
                     type = "png"
              }
              this.setData({
                     dpr,
                     _$num,
                     head_style,
                     crop_style,
                     crop_size,
                     dx,
                     dy
              })
              const query = this.createSelectorQuery();
              query.select("#mask").node(res => {
                     var _canvas = res.node;
                     var _ctx = _canvas.getContext("2d");
                     _canvas.width = _$pw * dpr;
                     _canvas.height = _$ph * dpr;
                     _ctx.scale(dpr, dpr);
                     _ctx.fillStyle = "#0007";
                     _ctx.fillRect(0, 0, _$pw, _$ph);
                     _ctx.lineJoin = "round";
                     _ctx.lineWidth = 8;
                     _ctx.strokeStyle = "#fff8";
                     _ctx.strokeRect(dx, dy, crop_size, crop_size);
                     _ctx.lineWidth = 4;
                     _ctx.strokeStyle = "#333";
                     _ctx.strokeRect(dx, dy, crop_size, crop_size);
                     _ctx.stroke();
                     _ctx.clearRect(dx, dy, crop_size, crop_size)
              })
              query.select("#cropper").node(res => {
                     var canvas = res.node;
                     var ctx = canvas.getContext('2d');
                     var that = this;
                     var ec = this.getOpenerEventChannel();

                     function callErr(errMsg) {
                         
                            wx.showModal({
                                   showCancel: false,
                                   title: "提示",
                                   content: errMsg,
                                   success() {
                                          ec.emit("error",{
                                                 errMsg
                                          })
                                          wx.navigateBack({
                                                 delta: 1
                                          })
                                   }
                            })
                     };
                     wx.getImageInfo({
                            src:path,
                            success(res) {

                                   var types = ["png", "jpg", "jpeg"]
                                   if (types.indexOf(res.type) === -1) {
                                          callErr(`不支持此格式图片`)
                                   } else {
                                          var {
                                                 width: iw,
                                                 height: ih,
                                          } = res,
                                          min_size = min(iw, ih),
                                                 scale = crop_size / min_size,
                                                 fit_wd = scale * iw,
                                                 fit_ht = scale * ih,
                                                 _$img = canvas.createImage(),
                                                 img_style = `width:${fit_wd}px;height:${fit_ht}px;left:${ (_$pw - fit_wd) / 2}px;top:${ (_$ph - fit_ht) / 2}px`;
                                          _$img.src = path;
                                          console.log(_$img)
                                          initData["imageInfo"] = res;
                                          if (_$num) {
                                                 size=floor(max(32, min(4096, size)))
                                                 canvas.width = size
                                                 canvas.height = size
                                                 ctx.scale(size / crop_size, size / crop_size)
                                                 ctx.translate(-dx, -dy)
                                                 initData.maxScale = 20
                                          } else {
                                                 initData.maxScale = max(min(min_size / 32, 20), 1)
                                          }
                                          that.setData({
                                                 _$img,
                                                 path,
                                                 size,
                                                 type,
                                                 img_style,
                                                 initData,
                                          })

                                   }
                            },
                            fail(err) {
                                   callErr("无效图片地址")
                            },
                            complete(e) {
                                   wx.hideLoading()
                            }
                     })
                     this.setData({
                            ctx,
                            canvas
                     })
              }).exec()
       },
       toast() {
              wx.showLoading({
                     title: '加载中',
                     mask: true
              })
       },
       getCroppedImg(e) {

              var that = this
              var {_$deimg,size}=this.data
              function call(img) {
                     if (e.type === "preview") {
                            that.previewImg(img)
                     } else {
                            that.confirmCrop(img)
                     }
              }
              if (e.crop) {
                     that.toast()
                     var {
                            canvas,
                            ctx,
                            dx,
                            dy,
                            crop_size,
                            type,
                            _$img,
                            _$num,
                     } = this.data;
                     var {
                            width: nw,
                            height: nh,
                            left: nl,
                            top: nt,
                            rotation,
                            scale
                     } = e, {
                            width: iw,
                            height: ih
                     } = _$img
                     if (!_$num) {
                            ctx.save()
                            size = min(iw, ih) / scale
                            size = floor(max(32, min(4096, size)))
                            canvas.width = size, canvas.height = size
                            ctx.scale(size / crop_size, size / crop_size)
                            ctx.translate(-dx, -dy)
                     }
                     ctx.save()
                     ctx.beginPath()
                     ctx.rect(dx, dy, crop_size, crop_size)
                     ctx.clip()
                     var ro = PI * rotation / 180,
                            xw = (iw * cos(ro) + ih * sin(ro) < 0 ? -nw : nw),
                            yh = (ih * cos(ro) - iw * sin(ro) < 0 ? -nh : nh),
                            dw = cos(ro) * xw - sin(ro) * yh,
                            dh = cos(ro) * yh + sin(ro) * xw
                     ctx.translate(nl + nw / 2, nt + nh / 2)
                     ctx.rotate(ro)
                     ctx.translate(-(nl + nw / 2), -(nt + nh / 2))
                     ctx.drawImage(_$img, 0, 0, iw, ih, nl + (nw - dw) / 2, nt + (nh - dh) / 2, dw, dh)
                     ctx.restore()
                     wx.canvasToTempFilePath({
                            canvas: canvas,
                            x: 0,
                            y: 0,
                            width: crop_size,
                            height: crop_size,
                            destWidth: size,
                            destHeight: size,
                            fileType: type,
                            success(res) {
                                   _$deimg = res.tempFilePath
                                   call({path:_$deimg,size})
                                   that.setData({
                                          _$deimg,
                                          size
                                   })

                            },
                            fail(res) {
                                   console.error("裁剪时出现错误:", res)
                            },
                            complete() {
                                   if (!_$num) {
                                          ctx.restore()
                                   }
                                   wx.hideLoading()
                                   ctx.clearRect(dx, dy, crop_size, crop_size)
                            }
                     })
              } else {
                     call({path:_$deimg,size})
              }
       },
       confirmCrop(e) {
              const ec = this.getOpenerEventChannel()
              ec.emit('finish', e);
              wx.navigateBack({
                     delta: 1,
              })
       },
       previewImg(e) {
              wx.previewImage({
                     urls: [e.path],
              })
       }
})