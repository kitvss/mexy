var profile_photo = f_dc_temp(function() {
    var finalDataURL;

    var preview_div_wrap = f_dc_temp({
        state: {
            class: 'preview_div_wrap'
        }
    }).iIn(bodytag);

    var preview_f_div = f_dc_temp({
        state: {
            class: 'preview_f_div'
        }
    }).iIn(preview_div_wrap);

    var photo_preview_wrap = f_dc_temp({
        state: {
            class: 'crop_img_wrap'
        }
    }).iIn(preview_f_div);

    var buttons = f_dc_temp().iIn(preview_f_div);

    var upload_b = f_dc_temp({
        eltype: 'button',
        state: {
            class: 'b',
            text: 'upload'
        },
        events: {
            click() {
                previewer.upload();
            }
        }
    }).iIn(buttons);

    f_dc_temp({
        eltype: 'button',
        state: {
            class: 'b',
            text: 'cancel'
        },
        events: {
            click() {
                previewer.cancel();
            }
        }
    }).iIn(buttons);

    var input = DC.temp({
        eltype: 'input',
        attrs: {
            type: 'file'
        },
        events: {
            change() {
                readURL(this);
            }
        }
    });

    var content = f_dc_temp({
        state: {
            class: 'center'
        }
    });

    f_dc_temp({
        state: {
            class: 'back_line',
            text: 'How about your profile photo?'
        }
    }).iIn(content);

    var my_picture = f_dc_temp({
        attrs: {
            class: 'profile_picture'
        },
        extend: {
            set(a) {
                this.el.css({ 'background-image': 'url(' + a + ')' });
            }
        },
        events: {
            u_data() {
                if (U.userdata.crop_photo) {
                    var url = cloudinary(U.userdata.crop_photo);
                    my_picture.set(url);
                }
            }
        }
    }).iIn(f_dc_temp().iIn(content));



    DC.temp({
        eltype: 'button',
        state: {
            text: 'change photo',
            class: 'b',
        },
        events: {
            click() {
                input.el.click();
            }
        }
    }).iIn(content);

    var previewer = function() {
        function crop_move(cursor,touch){
            var el = crop_border.el;
            var left = parseInt(el.css('left')) || 0;
            var top = parseInt(el.css('top')) || 0;
            var dx = cursor.clientX - left;
            var dy = cursor.clientY - top;
            if (!mm.f) mm.f = function(e) {
                cursor = touch ? e.changedTouches[0] : e;
                var x = cursor.clientX - dx, y = cursor.clientY - dy;
                var rect = el.crec();
                if (x < 0) x = 0;
                if (y < 0) y = 0;
                if (x + rect.width > imel.width) x = imel.width - rect.width;
                if (y + rect.height > imel.height) y = imel.height - rect.height;
                el.css({ left: x, top: y });
            }
        }
        function crop_resize(cursor,touch){
            var el = crop_border.el;
            var rect = el.crec();
            var left = parseInt(el.css('left')) || 0;
            var top = parseInt(el.css('top')) || 0;
            var k = imel.width / imel.naturalWidth;
            var min = 300 * k;
            var fx = cursor.clientX;
            var fy = cursor.clientY;
            if (!mm.f) mm.f = function(e) {
                cursor = touch ? e.changedTouches[0] : e;
                var w = cursor.clientX - fx + rect.width, h = cursor.clientY - fy + rect.height;
                if (w < min) w = min;
                if (h < min) h = min;
                if (left + w > imel.width) w = imel.width - left;
                if (h > imel.height - top) h = imel.height - top;
                if (w < h) h = w;
                if (h < w) w = h;
                el.css({ width: w, height: h });
            }
        }
        var crop_border = f_dc_temp({
            state: {
                class: 'crop_img_border'
            },
            events: {
                mousedown(e) {
                    f_preventDefault(e);
                    crop_move(e);
                },
                touchstart(e) {
                    f_preventDefault(e);
                    g_drag_event = 1;
                    crop_move(e.changedTouches[0],1)
                }
            }
        }).iIn(photo_preview_wrap);
        f_dc_temp({
            state: {
                class: 'crop_img_resize'
            },
            events: {
                mousedown(e) {
                    f_preventDefault(e);
                    crop_resize(e)
                },
                touchstart(e) {
                    f_preventDefault(e);
                    g_drag_event = 1;
                    crop_resize(e.changedTouches[0],1);
                },
            }
        }).iIn(crop_border);
        var preview_image = f_dc_temp({
            eltype: 'img',
            state: {
                class: 'img_preview'
            }
        }).iIn(photo_preview_wrap);

        var info = f_dc_temp({
            state: {
                class: 'back_line'
            }
        }).iIn(photo_preview_wrap);

        var imel = preview_image.el;
        imel.onload = function() {
            finalDataURL = imel.src;
            if(imel.naturalWidth < 300 || imel.naturalHeight < 300){
                f_logIs('too liitle image');
                fn.cancel();
            }
        }

        var fn = {};

        fn.open = function(dataURL) {
            if (dataURL.length > 5000000) return f_logIs('too large photo');
            preview_image.el.src = dataURL;
            crop_border.el.css({ left: 0, top: 0, width: 100, height: 100 });
            preview_div_wrap.el.show();
            upload_b.el.show('inline-block');
            info.t = '';
        }

        fn.cancel = function() {
            preview_image.src = '';
            input.v = '';
            finalDataURL = false;
            preview_div_wrap.el.hide();
        }

        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = 300;

        fn.crop = function(cb) {
            var el = crop_border.el;
            var imel = preview_image.el;
            var k = imel.width / imel.naturalWidth;
            var rect = el.crec();
            var size = rect.width / k;
            if (size < 300) size = 300;
            var left = parseInt(el.css('left')) || 0;
            var top = parseInt(el.css('top')) || 0;

            var context = canvas.getContext('2d');
            var img = new Image();

            img.onload = function() {
                // draw cropped image
                var sourceX = left / k;
                var sourceY = top / k;
                var sourceWidth = size;
                var sourceHeight = size;
                var destWidth = 300;
                var destHeight = 300;
                var destX = 0;
                var destY = 0;

                context.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);

                cb(canvas.toDataURL());
            };
            img.src = imel.src;
        }

        function uploadPacks(o) {
            if (!finalDataURL) return;
            var packs = o.arr;
            if (o.cur == 0) o.total = packs.length;
            var cur = o.cur, total = o.total;
            if (cur == total) {
                if (o.type == 'crop') {
                    info.t = 'saving crop photo...';
                    f_semit('save_crop_photo', { loid: o.loid }, res => {
                        if (res.crop_photo) {
                            U.userdata.crop_photo = res.crop_photo;
                            DC.emit('u_data');
                        }
                        info.t = 'done!';
                        upload_b.el.show('inline-block');
                        fn.cancel();
                    });
                } else if (o.type == 'orig') {
                    info.t = 'saving photo...';
                    f_semit('save_photo', { loid: o.loid }, res => {
                        info.t = 'cropping photo...';
                        fn.crop(dataURL => {
                            finalDataURL = dataURL;
                            fn.upload({ type: 'crop' });
                        });
                    });
                }
                return;
            }
            f_semit('upload', {
                bin: packs[cur],
                loid: o.loid
            }, res => {
                if (res && res.reason) {
                    console.log('error happened');
                } else {
                    console.log('packet', cur, 'uploaded');
                    o.cur++;
                    info.t = 'uploading... ' + Math.floor(cur / total * 100) + '%';
                    uploadPacks(o);
                }
            });
        }

        fn.upload = function(ops = {}) {
            if (!finalDataURL) return info.t = 'empty file data';
            var packsize = 40000;// split our data into chunks of 40KB
            fetch(finalDataURL)
                .then(res => res.blob())
                .then(blob => {
                    console.log(blob);
                    if (blob.size > 4000000) return info.t = 'too large file';
                    // console.log(blob)
                    var packs = [];
                    for (let i = 0, l = Math.floor(blob.size / packsize); i <= l; i++) {
                        packs.push(blob.slice(i * packsize, i * packsize + packsize));
                    }
                    upload_b.el.hide();
                    uploadPacks({
                        arr: packs,
                        cur: 0,
                        loid: f_gen_loid(),
                        type: ops.type || 'orig'
                    })
                })
        }

        fn.cancel();

        return fn;
    } ();

    function readURL(input) {

        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function(e) {
                previewer.open(e.target.result);
            }

            reader.readAsDataURL(input.files[0]);
        }
    }
    return {
        extend: {
            set: function(v) {
                // 
            }
        },
        init: function() {
            return content;
        }
    }
});
