import { useEffect, useState, useRef } from "react";

class mat4 {
    constructor()
    {
        //COLUMN MAJOR ALIGNMENT
        this.f32a = new Float32Array(16); //float 32 array
        for( var i=0; i<16; i++)
        {
            this.f32a[i] = 0;
        }
    }
    setValues(array)
    {
        if (array.length != 16)
        {
            console.error("mat4.set(array) - array.length != 16");
            return;
        }
        for (var i=0; i<16; i++)
        {
            this.f32a[i] = array[i];
        }
        return this;
    }
    setUnit()
    {
        for( var i=0; i<16; i++)
        {
            this.f32a[i] = 0;
        }
        this.f32a[0] = 1;
        this.f32a[5] = 1;
        this.f32a[10] = 1;
        this.f32a[15] = 1;
        return this;
    }
    makePerspective(FOV, aspect, near, far)
    {
        var f = Math.tan(Math.PI * 0.5 - 0.5 * FOV);
        var range = 1.0/(near-far);
        this.f32a[0] = f/aspect;
        this.f32a[4] = 0;
        this.f32a[8] = 0;
        this.f32a[12] = 0;

        this.f32a[1] = 0;
        this.f32a[5] = f;
        this.f32a[9] = 0;
        this.f32a[13] = 0;

        this.f32a[2] = 0;
        this.f32a[6] = 0;
        this.f32a[10] = (near+far)*range;
        this.f32a[14] = -1;

        this.f32a[3] = 0;
        this.f32a[7] = 0;
        this.f32a[11] = near*far*range*2;
        this.f32a[15] = 0;
        return this;
    }
    makeOrthogonal(zoom, aspect, near, far)
    {
        var range = 1.0/(far);

        this.f32a[0] = (1/aspect) * zoom;
        this.f32a[4] = 0;
        this.f32a[8] = 0;
        this.f32a[12] = 0;

        this.f32a[1] = 0;
        this.f32a[5] = zoom;
        this.f32a[9] = 0;
        this.f32a[13] = 0;

        this.f32a[2] = 0;
        this.f32a[6] = 0;
        this.f32a[10] = range;
        this.f32a[14] = 1;

        this.f32a[3] = 0;
        this.f32a[7] = 0;
        this.f32a[11] = 0;
        this.f32a[15] = 1;
        return this;
    }
    makeTranslation(x,y=0,z=0)
    {
        if (x instanceof vec4)
        {
            y = x.y;
            z = x.z;
            x = x.x;
        }

        if (x == null || isNaN(x)) { x = 0;}
        if (y == null || isNaN(y)) { y = 0;}
        if (z == null || isNaN(z)) { z = 0;}

        //COLUMN MAJOR ALIGNMENT
        this.f32a[0] = 1;
        this.f32a[4] = 0;
        this.f32a[8] = 0;
        this.f32a[12] = x;

        this.f32a[1] = 0;
        this.f32a[5] = 1;
        this.f32a[9] = 0;
        this.f32a[13] = y;

        this.f32a[2] = 0;
        this.f32a[6] = 0;
        this.f32a[10] = 1;
        this.f32a[14] = z;

        this.f32a[3] = 0;
        this.f32a[7] = 0;
        this.f32a[11] = 0;
        this.f32a[15] = 1;
        
        return this;
    }
    makeTranslationAndScale(tx,ty,tz=0, sx=1, sy=1, sz=1)
    {
        if (tx instanceof vec4 && ty instanceof vec4)
        {
            sx = ty.x;
            sy = ty.y;
            sz = ty.z;

            ty = tx.y;
            tz = tx.z;
            tx = tx.x;
        } else {
            if (tx == null || isNaN(tx) || ty == null || isNaN(ty)) {
                console.error("mart4.makeTranslationAndScale() requires either 2 vec4s or 6 scalars as inputs. Given null values.");
                return;
            }
        }

        //COLUMN MAJOR ALIGNMENT
        this.f32a[0] = sx;
        this.f32a[4] = 0;
        this.f32a[8] = 0;
        this.f32a[12] = tx;

        this.f32a[1] = 0;
        this.f32a[5] = sy;
        this.f32a[9] = 0;
        this.f32a[13] = ty;

        this.f32a[2] = 0;
        this.f32a[6] = 0;
        this.f32a[10] = sz;
        this.f32a[14] = tz;

        this.f32a[3] = 0;
        this.f32a[7] = 0;
        this.f32a[11] = 0;
        this.f32a[15] = 1;
        
        return this;
    }
    makeScale(x,y=1,z=1,a=1)
    {
        if (x instanceof vec4)
        {
            //COLUMN MAJOR ALIGNMENT
            this.f32a[0] = x.x;
            this.f32a[4] = 0;
            this.f32a[8] = 0;
            this.f32a[12] = 0;

            this.f32a[1] = 0;
            this.f32a[5] = x.y;
            this.f32a[9] = 0;
            this.f32a[13] = 0;

            this.f32a[2] = 0;
            this.f32a[6] = 0;
            this.f32a[10] = x.z;
            this.f32a[14] = 0;

            this.f32a[3] = 0;
            this.f32a[7] = 0;
            this.f32a[11] = 0;
            this.f32a[15] = x.a;
        } else {

            //COLUMN MAJOR ALIGNMENT
            this.f32a[0] = x;
            this.f32a[4] = 0;
            this.f32a[8] = 0;
            this.f32a[12] = 0;

            this.f32a[1] = 0;
            this.f32a[5] = y;
            this.f32a[9] = 0;
            this.f32a[13] = 0;

            this.f32a[2] = 0;
            this.f32a[6] = 0;
            this.f32a[10] = z;
            this.f32a[14] = 0;

            this.f32a[3] = 0;
            this.f32a[7] = 0;
            this.f32a[11] = 0;
            this.f32a[15] = a;
        }
        return this;
    }
    makeRotation(a,b,y) {
        if (a instanceof vec4)
        {
            y = a.z;
            b = a.y;
            a = a.x;
        }

        //COLUMN MAJOR ALIGNMENT
        if (a == null || isNaN(a)) { a = 0;}
        if (b == null || isNaN(b)) { b = 0;}
        if (y == null || isNaN(y)) { y = 0;}
        var sa = Math.sin(a);
        var ca = Math.cos(a);
        var sb = Math.sin(b);
        var cb = Math.cos(b);
        var sy = Math.sin(y);
        var cy = Math.cos(y);

        this.f32a[0] = ca*cb;
        this.f32a[4] = ca*sb*sy-sa*cy;
        this.f32a[8] = ca*sb*cy+sa*sy;
        this.f32a[12] = 0;

        this.f32a[1] = sa*cb;
        this.f32a[5] = sa*sb*sy+ca*cy;
        this.f32a[9] = sa*sb*cy-ca*sy;
        this.f32a[13] = 0;

        this.f32a[2] = -sb;
        this.f32a[6] = cb*sy;
        this.f32a[10] = cb*cy;
        this.f32a[14] = 0;

        this.f32a[3] = 0;
        this.f32a[7] = 0;
        this.f32a[11] = 0;
        this.f32a[15] = 1;
        return this;
    }
    makeRotationX(r)
    {
        this.f32a[0] = 1;
        this.f32a[4] = 0;
        this.f32a[8] = 0;
        this.f32a[12] = 0;

        this.f32a[1] = 0;
        this.f32a[5] = Math.cos(r);
        this.f32a[9] = -Math.sin(r);
        this.f32a[13] = 0;

        this.f32a[2] = 0;
        this.f32a[6] = Math.sin(r);
        this.f32a[10] = Math.cos(r);
        this.f32a[14] = 0;

        this.f32a[3] = 0;
        this.f32a[7] = 0;
        this.f32a[11] = 0;
        this.f32a[15] = 1;
        return this;
    }
    makeRotationY(r)
    {
        this.f32a[0] = Math.cos(r);
        this.f32a[4] = 0;
        this.f32a[8] = Math.sin(r);
        this.f32a[12] = 0;

        this.f32a[1] = 0;
        this.f32a[5] = 1;
        this.f32a[9] = 0;
        this.f32a[13] = 0;

        this.f32a[2] = -Math.sin(r);
        this.f32a[6] = 0;
        this.f32a[10] = Math.cos(r);
        this.f32a[14] = 0;

        this.f32a[3] = 0;
        this.f32a[7] = 0;
        this.f32a[11] = 0;
        this.f32a[15] = 1;
        return this;
    }
    makeRotationZ(r)
    {
        this.f32a[0] = Math.cos(r);
        this.f32a[4] = -Math.sin(r);
        this.f32a[8] = 0;
        this.f32a[12] = 0;

        this.f32a[1] = Math.sin(r);
        this.f32a[5] = Math.cos(r);
        this.f32a[9] = 0;
        this.f32a[13] = 0;

        this.f32a[2] = 0;
        this.f32a[6] = 0;
        this.f32a[10] = 1;
        this.f32a[14] = 0;

        this.f32a[3] = 0;
        this.f32a[7] = 0;
        this.f32a[11] = 0;
        this.f32a[15] = 1;
        return this;
    }
    makeTranslationRotationScale(pos=new vec4(), rotation=new vec4(), scale=new vec4(1,1,1)) {
        const f1 = [1,0,0,0, 0,1,0,0, 0,0,1,0, pos.x,pos.y,pos.z,1,]; //f1 is trans matrix 
        const sca = [scale.x,0,0,0, 0,scale.y,0,0, 0,0,scale.z,0, 0,0,0,1]; //sca is scale matrix
        
        //make rot[], rotation matrix
        const y = rotation.z;
        const b = rotation.y;
        const a = rotation.x;
        const sa = Math.sin(a);
        const ca = Math.cos(a);
        const sb = Math.sin(b);
        const cb = Math.cos(b);
        const sy = Math.sin(y);
        const cy = Math.cos(y);

        /*const rot = [
            ca*cb,   ca*sb*sy-sa*cy,   ca*sb*cy+sa*sy,   0,
            sa*cb,   sa*sb*sy+ca*cy,   sa*sb*cy-ca*sy,   0,
            -sb,     cb*sy,            cb*cy,            0,
            0,       0,                0,                1,
        ];*/
        const rot = [
            ca*cb,                     sa*cb,              -sb,            0,
            ca*sb*sy-sa*cy,   sa*sb*sy+ca*cy,              cb*sy,            0,
            ca*sb*cy+sa*sy,          sa*sb*cy-ca*sy,        cb*cy,            0,
            0,                            0,                0,                1,
        ];

        const f2 = [ //rotation * scale
            rot[0]*sca[0] + rot[4]*sca[1] + rot[8]*sca[2] + rot[12]*sca[3],
            rot[1]*sca[0] + rot[5]*sca[1] + rot[9]*sca[2] + rot[13]*sca[3],
            rot[2]*sca[0] + rot[6]*sca[1] + rot[10]*sca[2] + rot[14]*sca[3],
            rot[3]*sca[0] + rot[7]*sca[1] + rot[11]*sca[2] + rot[15]*sca[3],

            rot[0]*sca[4] + rot[4]*sca[5] + rot[8]*sca[6] + rot[12]*sca[7],
            rot[1]*sca[4] + rot[5]*sca[5] + rot[9]*sca[6] + rot[13]*sca[7],
            rot[2]*sca[4] + rot[6]*sca[5] + rot[10]*sca[6] + rot[14]*sca[7],
            rot[3]*sca[4] + rot[7]*sca[5] + rot[11]*sca[6] + rot[15]*sca[7],

            rot[0]*sca[8] + rot[4]*sca[9] + rot[8]*sca[10] + rot[12]*sca[11],
            rot[1]*sca[8] + rot[5]*sca[9] + rot[9]*sca[10] + rot[13]*sca[11],
            rot[2]*sca[8] + rot[6]*sca[9] + rot[10]*sca[10] + rot[14]*sca[11],
            rot[3]*sca[8] + rot[7]*sca[9] + rot[11]*sca[10] + rot[15]*sca[11],

            rot[0]*sca[12] + rot[4]*sca[13] + rot[8]*sca[14] + rot[12]*sca[15],
            rot[1]*sca[12] + rot[5]*sca[13] + rot[9]*sca[14] + rot[13]*sca[15],
            rot[2]*sca[12] + rot[6]*sca[13] + rot[10]*sca[14] + rot[14]*sca[15],
            rot[3]*sca[12] + rot[7]*sca[13] + rot[11]*sca[14] + rot[15]*sca[15],
        ];

        const vals = [
            f1[0]*f2[0] + f1[4]*f2[1] + f1[8]*f2[2] + f1[12]*f2[3],
            f1[1]*f2[0] + f1[5]*f2[1] + f1[9]*f2[2] + f1[13]*f2[3],
            f1[2]*f2[0] + f1[6]*f2[1] + f1[10]*f2[2] + f1[14]*f2[3],
            f1[3]*f2[0] + f1[7]*f2[1] + f1[11]*f2[2] + f1[15]*f2[3],

            f1[0]*f2[4] + f1[4]*f2[5] + f1[8]*f2[6] + f1[12]*f2[7],
            f1[1]*f2[4] + f1[5]*f2[5] + f1[9]*f2[6] + f1[13]*f2[7],
            f1[2]*f2[4] + f1[6]*f2[5] + f1[10]*f2[6] + f1[14]*f2[7],
            f1[3]*f2[4] + f1[7]*f2[5] + f1[11]*f2[6] + f1[15]*f2[7],

            f1[0]*f2[8] + f1[4]*f2[9] + f1[8]*f2[10] + f1[12]*f2[11],
            f1[1]*f2[8] + f1[5]*f2[9] + f1[9]*f2[10] + f1[13]*f2[11],
            f1[2]*f2[8] + f1[6]*f2[9] + f1[10]*f2[10] + f1[14]*f2[11],
            f1[3]*f2[8] + f1[7]*f2[9] + f1[11]*f2[10] + f1[15]*f2[11],

            f1[0]*f2[12] + f1[4]*f2[13] + f1[8]*f2[14] + f1[12]*f2[15],
            f1[1]*f2[12] + f1[5]*f2[13] + f1[9]*f2[14] + f1[13]*f2[15],
            f1[2]*f2[12] + f1[6]*f2[13] + f1[10]*f2[14] + f1[14]*f2[15],
            f1[3]*f2[12] + f1[7]*f2[13] + f1[11]*f2[14] + f1[15]*f2[15],
        ];

        this.setValues(vals);
        
        return this;
    }
    makeIdentity()
    {
        this.f32a[0] = 1;
        this.f32a[4] = 0;
        this.f32a[8] = 0;
        this.f32a[12] = 0;

        this.f32a[1] = 0;
        this.f32a[5] = 1;
        this.f32a[9] = 0;
        this.f32a[13] = 0;

        this.f32a[2] = 0;
        this.f32a[6] = 0;
        this.f32a[10] = 1;
        this.f32a[14] = 0;

        this.f32a[3] = 0;
        this.f32a[7] = 0;
        this.f32a[11] = 0;
        this.f32a[15] = 1;
        return this;
    }
    mul(mat) {
        if (mat instanceof mat4) {
            var f1 = this.getFloat32Array();
            var f2 = mat.getFloat32Array();
            var out = new mat4();
            var vals = [
                f1[0]*f2[0] + f1[4]*f2[1] + f1[8]*f2[2] + f1[12]*f2[3],
                f1[1]*f2[0] + f1[5]*f2[1] + f1[9]*f2[2] + f1[13]*f2[3],
                f1[2]*f2[0] + f1[6]*f2[1] + f1[10]*f2[2] + f1[14]*f2[3],
                f1[3]*f2[0] + f1[7]*f2[1] + f1[11]*f2[2] + f1[15]*f2[3],

                f1[0]*f2[4] + f1[4]*f2[5] + f1[8]*f2[6] + f1[12]*f2[7],
                f1[1]*f2[4] + f1[5]*f2[5] + f1[9]*f2[6] + f1[13]*f2[7],
                f1[2]*f2[4] + f1[6]*f2[5] + f1[10]*f2[6] + f1[14]*f2[7],
                f1[3]*f2[4] + f1[7]*f2[5] + f1[11]*f2[6] + f1[15]*f2[7],

                f1[0]*f2[8] + f1[4]*f2[9] + f1[8]*f2[10] + f1[12]*f2[11],
                f1[1]*f2[8] + f1[5]*f2[9] + f1[9]*f2[10] + f1[13]*f2[11],
                f1[2]*f2[8] + f1[6]*f2[9] + f1[10]*f2[10] + f1[14]*f2[11],
                f1[3]*f2[8] + f1[7]*f2[9] + f1[11]*f2[10] + f1[15]*f2[11],

                f1[0]*f2[12] + f1[4]*f2[13] + f1[8]*f2[14] + f1[12]*f2[15],
                f1[1]*f2[12] + f1[5]*f2[13] + f1[9]*f2[14] + f1[13]*f2[15],
                f1[2]*f2[12] + f1[6]*f2[13] + f1[10]*f2[14] + f1[14]*f2[15],
                f1[3]*f2[12] + f1[7]*f2[13] + f1[11]*f2[14] + f1[15]*f2[15],
            ];
            out.setValues(vals);
            return out;
        } else if (mat instanceof vec4) {
            var f1 = this.getFloat32Array();
            var f2 = mat.getFloat32Array();
            var vals = [
                f1[0]*f2[0] + f1[4]*f2[1] + f1[8]*f2[2] + f1[12]*f2[3],
                f1[1]*f2[0] + f1[5]*f2[1] + f1[9]*f2[2] + f1[13]*f2[3],
                f1[2]*f2[0] + f1[6]*f2[1] + f1[10]*f2[2] + f1[14]*f2[3],
                f1[3]*f2[0] + f1[7]*f2[1] + f1[11]*f2[2] + f1[15]*f2[3],
            ];
            return (new vec4).set(vals);
        } else if (typeof mat == 'number') {
            var newMat = new mat4();
            for(var i=0; i<16; i++)
            {
                newMat.f32a[i] = this.f32a[i] * mat;
            }
            return newMat;
        }
        console.error("mat4.mul() was passed Object it couldn't multiply. Valid types: mat4, vec4, number. ");
        return null;
    }
    muli(mat) {
        //Multiply into mat4 object.
        if (mat instanceof mat4) {
            var f1 = this.getFloat32Array();
            var f2 = mat.getFloat32Array();
            //var out = new mat4();
            
            this.f32a[0] = f1[0]*f2[0] + f1[4]*f2[1] + f1[8]*f2[2] + f1[12]*f2[3];
            this.f32a[1] = f1[1]*f2[0] + f1[5]*f2[1] + f1[9]*f2[2] + f1[13]*f2[3];
            this.f32a[2] = f1[2]*f2[0] + f1[6]*f2[1] + f1[10]*f2[2] + f1[14]*f2[3];
            this.f32a[3] = f1[3]*f2[0] + f1[7]*f2[1] + f1[11]*f2[2] + f1[15]*f2[3];

            this.f32a[4] = f1[0]*f2[4] + f1[4]*f2[5] + f1[8]*f2[6] + f1[12]*f2[7];
            this.f32a[5] = f1[1]*f2[4] + f1[5]*f2[5] + f1[9]*f2[6] + f1[13]*f2[7];
            this.f32a[6] = f1[2]*f2[4] + f1[6]*f2[5] + f1[10]*f2[6] + f1[14]*f2[7];
            this.f32a[7] = f1[3]*f2[4] + f1[7]*f2[5] + f1[11]*f2[6] + f1[15]*f2[7];

            this.f32a[8] = f1[0]*f2[8] + f1[4]*f2[9] + f1[8]*f2[10] + f1[12]*f2[11];
            this.f32a[9] = f1[1]*f2[8] + f1[5]*f2[9] + f1[9]*f2[10] + f1[13]*f2[11];
            this.f32a[10] = f1[2]*f2[8] + f1[6]*f2[9] + f1[10]*f2[10] + f1[14]*f2[11];
            this.f32a[11] = f1[3]*f2[8] + f1[7]*f2[9] + f1[11]*f2[10] + f1[15]*f2[11];

            this.f32a[12] = f1[0]*f2[12] + f1[4]*f2[13] + f1[8]*f2[14] + f1[12]*f2[15];
            this.f32a[13] = f1[1]*f2[12] + f1[5]*f2[13] + f1[9]*f2[14] + f1[13]*f2[15];
            this.f32a[14] = f1[2]*f2[12] + f1[6]*f2[13] + f1[10]*f2[14] + f1[14]*f2[15];
            this.f32a[15] = f1[3]*f2[12] + f1[7]*f2[13] + f1[11]*f2[14] + f1[15]*f2[15];
            
            return this;
        } else if (typeof mat == 'number') {
            for(var i=0; i<16; i++)
            {
                this.f32a[i] = this.f32a[i] * mat;
            }
            return this;
        }
        console.error("mat4.muli() requires either a mat4 or a scalar as an input.");
        return null;
    }
    add(mat) {
        if (mat instanceof mat4)
        {
            var newMat = new mat4();
            for (var i=0; i<16; i++)
            {
                newMat.f32a[i] = this.f32a[i] + mat.f32a[i];
            }
            return newMat;
        } else {
            console.error("mat4.add() requires a mat4 as the argument");
        }
    }
    sub(mat) {
        
        if (mat instanceof mat4)
        {
            var newMat = new mat4();
            for (var i=0; i<16; i++)
            {
                newMat.f32a[i] = this.f32a[i] - mat.f32a[i];
            }
            return newMat;
        } else {
            console.error("mat4.sub() requires a mat4 as the argument");
        }
    }
    getFloat32Array()
    {
        return this.f32a;
    }
    toString(fixed = 4)
    {
        //return this.print();
        var s = "";
        var vals = [];
        for (var i=0; i<16; i++)
        {
            vals.push(this.f32a[i].toFixed(fixed));
        }
        s += vals[0] + " " + vals[4] + " " + vals[8] + " " + vals[12] + "\n";
        s += vals[1] + " " + vals[5] + " " + vals[9] + " " + vals[13] + "\n";
        s += vals[2] + " " + vals[6] + " " + vals[10] + " " + vals[14] + "\n";
        s += vals[3] + " " + vals[7] + " " + vals[11] + " " + vals[15] + "\n";
        return s;
    }
    print()
    {
        console.log(this.toString());
    }
    copy()
    {
        var m = new mat4();
        m.setValues( this.getFloat32Array() );
        return m;
    }
    invert()
    {        
        //Alrighty this is math I don't really care for but I need so here goes nothing
        
        /*
        0  4  8   12
        1  5  9   13
        2  6  10  14
        3  7  11  15
        */
        var mat = this.copy();
        var mat2 = (new mat4()).makeIdentity();
        /*
        console.log("mat2\n" + mat2.toString());
        for (var column = 0; column < 4; column ++)
        {
            for (var row = 3; row > column; row--)
            {
                var index = column*4 + row;
                
                if (mat.f32a[index] == 0) //if the index is already 0, just continue. We don't need to reduce it!
                {
                    continue;
                } else {
                    //so, at index column row, we have a value we need to reduce.
                    //lets find a different non-zero index in this column
                    var row2 = -1;
                    for(var r2 = row-1; r2 >= 0; r2--)
                    {
                        if (mat.f32a[column*4 + r2] != 0) 
                        {
                            row2 = r2;
                            break;
                        }
                    }
                    if (row2 == -1)
                    {
                        console.error("Cannot find inverse of matrix. Error: no above row to reduce with!");
                        return;
                    }
                    
                    //now, we have 2 row indexes, and we want to remove the item from the bottom row (higher row #)
                    //Formula: valToRemove + otherVal*X = 0    -->   X = -valToRemove/otherVal
                    var X = -mat.f32a[column*4 + row]/mat.f32a[column*4 + row2];
                    for (var column2 = 0; column2 < 4; column2++) //Now, for each column, add the val in row2 * X to row
                    {
                        mat.f32a[column2*4 + row] += X * mat.f32a[column2*4 + row2];
                        mat2.f32a[column2*4 + row] += X * mat2.f32a[column2*4 + row2];
                    }
                }
                
                console.log("C: "+column+"  R: "+row+"\n"+mat.toString());
            }
        }
        //At this point, we should have removed the bottom left triangle and set that to 0. Now, lets scale each row so the diagonal (topleft-bottomright) only has 1's
        for (var i=0; i<4; i++)
        {
            var val = mat.f32a[i*4+i];
            if (val == 0) //if the diagonal index (row i, column i) is not already == 1
            {
                console.error("Cannot find inverse of matrix. Error: cannot get diagonal of 1's! Wil divide by zero.");
                return;
            }
            //Get 1 in diagonal spot
            for (var c=0; c<4; c++)
            {
                mat.f32a[c*4 + i] = mat.f32a[c*4 + i]/val;
                mat2.f32a[c*4 + i] = mat2.f32a[c*4 + i]/val;
            }
        }
        console.log("After getting 1's: \n"+mat.toString());
        //Now, we've reduced to the point where we have a diagonal of 1's with nothing below/left of it.
        //cleanup upper side!
        for (var i=3; i>0; i--)
        {
            for (var r2 = i-1; r2 >=0; r2--)
            {
                // mat[col=i, row=r2] + X*1 = 0    (the 1 comes from index=i*4 + i, the diagonal)
                var X = -mat.f32a[i*4 + r2];
                var c2 = i;
                mat.f32a[c2*4 + r2] += X * mat.f32a[c2*4 + i];
                mat2.f32a[c2*4 + r2] += X * mat2.f32a[c2*4 + i];
                
            }
        }
        console.log("Final: \n"+mat.toString());
        console.log("inverse: \n" + mat2.toString());
        */

        for(var c = 0; c<4; c++)
        {
            //console.log("C: "+c+" \n"+mat.toString()+"\n"+mat2.toString());
            if (mat.f32a[c*4 + c] == 0)
            {
                console.error("Cannot Invert Matrix: Diagonal has a 0. Cannot divide by zero");
                return;
            }

            //divide entire row to get 1.
            var X = mat.f32a[c*4 + c];
            for (var c2 = 0; c2 < 4; c2++)
            {
                mat.f32a[c2*4 + c] = mat.f32a[c2*4 + c]/X;
                mat2.f32a[c2*4 + c] = mat2.f32a[c2*4 + c]/X;
            }

            //console.log("After Div Row by X: " +X+"\n"+mat.toString()+"\n"+mat2.toString());


            //remove all vals in column other than in row c
            var otherRow = -1;
            for (var r=0; r<4; r++)
            {
                if (r != c && mat.f32a[c*4 + r] != 0)
                {
                    //otherIndexVal + 1*X = 0   -->   X = -otherIndexVal
                    var X = mat.f32a[c*4 + r];
                    for (var c2=0; c2<4; c2++)
                    {
                        mat.f32a[c2*4 + r] += -X * mat.f32a[c2*4+c];
                        mat2.f32a[c2*4 + r] += -X * mat2.f32a[c2*4+c];
                    }
                }
                //console.log("After Clearing R: " +r+"\n"+mat.toString()+"\n"+mat2.toString());
            }
        }//-Math.atan(glPos.x*zNear)

        //console.log("REsult: \n"+mat.toString()+"\n"+mat2.toString());
        return mat2;



        mat2 = new mat4();

        mat2.f32a[0] = 1/mat.f32a[0];
        mat2.f32a[5] = 1/mat.f32a[5];
        mat2.f32a[11] = 1/mat.f32a[14];
        mat2.f32a[14] = 1/mat.f32a[11];
        mat2.f32a[15] = -mat.f32a[10] / ( mat.f32a[14] * mat.f32a[11] );

        return mat2;
    }
}

class vec4 {
    constructor(x,y,z,a) {
        if (x == null || isNaN(x)) { x = 0;}
        if (y == null || isNaN(y)) { y = 0;}
        if (z == null || isNaN(z)) { z = 0;}
        if (a == null || isNaN(a)) { a = 0;}
        this.x = x;
        this.y = y;
        this.z = z;
        this.a = a;
    }
    set(x,y,z,a) {
        if (x != null && (x instanceof Array == false))
        {
            this.x = x;
            this.y = y;
            this.z = z;
            this.a = a;
        } else if (x instanceof Array) {
            switch (x.length) {
                case 4: this.x=x[0];this.y=x[1];this.z=x[2];this.a=x[3];break;
                case 3: this.x=x[0];this.y=x[1];this.z=x[2];break;
                case 2: this.x=x[0];this.y=x[1];break;
                case 1: this.x=x[0];break;
            };
        }
        return this;
    }
    add(x,y,z,a)
    {
        if (x instanceof vec4)
        {
            return new vec4(this.x+x.x, this.y+x.y, this.z+x.z, this.a+x.a);
        }
        if (isNaN(x)) { x = 0;}
        if (isNaN(y)) { y = 0;}
        if (isNaN(z)) { z = 0;}
        if (isNaN(a)) { a = 0;}
        return new vec4(this.x+x, this.y+y, this.z+z, this.a+a); 
    }
    addi(x,y=0,z=0,a=0)
    {
        if (x instanceof vec4)
        {
            //return new vec4(this.x+x.x, this.y+x.y, this.z+x.z, this.a+x.a);
            this.x += x.x;
            this.y += x.y;
            this.z += x.z;
            this.a += x.a;
            return this;
        }

        if (isNaN(x)) { x = 0;}
        if (isNaN(y)) { y = 0;}
        if (isNaN(z)) { z = 0;}
        if (isNaN(a)) { a = 0;}
        //return new vec4(this.x+x, this.y+y, this.z+z, this.a+a);
        this.x += x;
        this.y += y;
        this.z += z;
        this.a += a;

        return this;
    }
    sub(x,y,z,a)
    {
        if (x instanceof vec4)
        {
            return new vec4(this.x-x.x, this.y-x.y, this.z-x.z, this.a-x.a);
        }
        if (isNaN(x)) { x = 0;}
        if (isNaN(y)) { y = 0;}
        if (isNaN(z)) { z = 0;}
        if (isNaN(a)) { a = 0;}
        return new vec4(this.x-x, this.y-y, this.z-z, this.a-a); 
    }
    subi(x,y=0,z=0,a=0)
    {
        if (x instanceof vec4)
        {
            //return new vec4(this.x+x.x, this.y+x.y, this.z+x.z, this.a+x.a);
            this.x -= x.x;
            this.y -= x.y;
            this.z -= x.z;
            this.a -= x.a;
            return this;
        }
        if (isNaN(x)) { x = 0;}
        if (isNaN(y)) { y = 0;}
        if (isNaN(z)) { z = 0;}
        if (isNaN(a)) { a = 0;}
        //return new vec4(this.x+x, this.y+y, this.z+z, this.a+a);
        this.x -= x;
        this.y -= y;
        this.z -= z;
        this.a -= a;
        return this;
    }
    mul(x,y=null,z=null,a=null)
    {
        if (x instanceof vec4)
        {
            //multiply by vector
            return new vec4(this.x*x.x, this.y*x.y, this.z*x.z, this.a*x.a);
        } else if ( !isNaN(x) && y == null && z == null && a == null) {
            //multiply by scalar
            return new vec4(this.x*x, this.y*x, this.z*x, this.a*x);
        } else if (x instanceof mat4)
        {
            console.error("vec4.mul() cannot take a mat4 as an argument. Try mat4.mul(vec4).");
        } else {
            //multiple by all scalars
            if (isNaN(x)) { x = 0;}
            if (isNaN(y)) { y = 0;}
            if (isNaN(z)) { z = 0;}
            if (isNaN(a)) { a = 0;}
            return new vec4(this.x*x, this.y*y, this.z*z, this.a*a);
        }
    }
    muli(x,y=null,z=null,a=null)
    {
        //console.log("x: " + x + "  y: " + y + "  z: " + z + "  a: " + a);
        if (x instanceof vec4)
        {
            //multiply by vector
            this.x = this.x*x.x;
            this.y = this.y*x.y;
            this.z = this.z*x.z;
            this.a = this.a*x.a;
        } else if ( !isNaN(Number(x)) && y == null && z == null && a == null) {
            //multiply by scalar
            this.x = this.x*x;
            this.y = this.y*x;
            this.z = this.z*x;
            this.a = this.a*x;
        } else {
            //multiple by all scalars
            if (isNaN(x)) { x = 0;}
            if (isNaN(y)) { y = 0;}
            if (isNaN(z)) { z = 0;}
            if (isNaN(a)) { a = 0;}
            this.x = this.x*x;
            this.y = this.y*y;
            this.z = this.z*z;
            this.a = this.a*a;
        }
        return this;
    }
    dot(vec)
    {
        if (vec instanceof vec4 == false)
        {
            console.error("vec4.dot() was passed a non vec4.")
            return null;
        }
        return this.x*vec.x + this.y*vec.y + this.z*vec.z + this.a*vec.a;
    }
    cross(vec)
    {
        if (vec instanceof vec4 == false)
        {
            console.error("vec4.dot() was passed a non vec4.")
            return null;
        }

        return new vec4(this.z*vec.y + this.y*vec.z, this.z*vec.x - this.x*vec.z, -this.y*vec.x + this.x*vec.y);
        /*
        let x = -this.z*vec.y + this.y*vec.z;
        let y = this.z*vec.x - this.x*vec.z;
        let z = -this.y*vec.x + this.x*vec.y;
        return new vec4(x,y,z);*/
    }
    getFloat32Array()
    {
        return new Float32Array([this.x,this.y,this.z,this.a]);
    }
    copy()
    {
        return new vec4(this.x, this.y, this.z, this.a);
    }
    getLength()
    {
        return Math.sqrt(  this.x*this.x + this.y*this.y + this.z*this.z  );
    }
    getMagnitude() {
        return Math.sqrt(  this.x*this.x + this.y*this.y + this.z*this.z  + this.a * this.a);
    }
    getHash()
    {
        return this.x*1000000 + this.y*1000 + this.z;
    }
    scaleToUnit()
    {
        //divide each component by the length of the vector
        var L = this.getMagnitude();
        if (L == 0) { return this; } 
        this.x = this.x/L;
        this.y = this.y/L;
        this.z = this.z/L;
        this.a = this.a/L;
        return this;
    }
    round(val = 1)
    {   
        this.x = Math.round(this.x/val)*val;
        this.y = Math.round(this.y/val)*val;
        this.z = Math.round(this.z/val)*val;
        return this;
    }
    toString(roundToValue = 0.01)
    {
        var p = 3;
        var s = "< " + (Math.round(this.x/roundToValue)*roundToValue).toPrecision(p)+", "+ (Math.round(this.y/roundToValue)*roundToValue).toPrecision(p)+", "+ (Math.round(this.z/roundToValue)*roundToValue).toPrecision(p)+", "+ (Math.round(this.a/roundToValue)*roundToValue).toPrecision(p)+">";
        return s;
    }
    equals(otherVec4)
    {
        if (otherVec4 instanceof vec4 && otherVec4.x == this.x && otherVec4.y == this.y && otherVec4.z == this.z && otherVec4.a == this.a)
        {
            return true;
        }
        return false;
    }
    greaterThan(otherVec4)
    {
        return this.getHash() > otherVec4.getHash();
    }
    closeTo(vec, delta = 0.000001)
    {
        return ((Math.abs(this.x-vec.x) + Math.abs(this.y-vec.y) + Math.abs(this.z-vec.z)) < delta)
    }
}

class SpeedyGL 
{
    constructor(htmlCanvasElement = null) {

        //Make sure htmlCanvasElement is not null.
        if (htmlCanvasElement == null) { console.error("Cannot instantiate GL object without canvasElement"); return null;}
        this.htmlCanvasElement = htmlCanvasElement;
        let bb = this.htmlCanvasElement.getBoundingClientRect();
        this.htmlCanvasElement.width = Math.round(bb.width);
        this.htmlCanvasElement.height = Math.round(bb.height);

        this.gl = htmlCanvasElement.getContext('webgl');

        //Make sure this.webgl is instance of WebGlRenderingContext
        if (!(this.gl instanceof WebGLRenderingContext)) { console.error("Failed to create webgl context."); return null;}

        // this.projectionMatrix   = new mat4();
        // this.viewMatrix         = new mat4();
        // this.cameraPosition     = new vec4();
        // this.lightingDirection  = new vec4(1,0);
        // this.ambientLightLevel  = 0.7;

        this.objectMap = new Map();

        this._initShader();
        this.clear();
    }
    __loadShader(type, source)//helper function used by _initShader() and _initPickerShader()
     {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
    
        // See if it compiled successfully
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    _initShader()//initialize the default shader
    {
        let functions = `
        mat4 makeRotation(vec4 rot)
        {
            float sa = sin(rot.x);
            float ca = cos(rot.x);
            float sb = sin(rot.y);
            float cb = cos(rot.y);
            float sy = sin(rot.x);
            float cy = cos(rot.z);

            // return mat4(  
            //     ca*cb, ca*sb*sy-sa*cy, ca*sb*cy+sa*sy, 0,
            //     sa*cb, sa*sb*sy+ca*cy, sa*sb*cy-ca*sy, 0,
            //     -sb, cb*sy, cb*cy, 0,
            //     0, 0, 0, 1
            // );
            return mat4(  
                ca*cb,sa*cb,-sb,0,
                ca*sb*sy-sa*cy, sa*sb*sy+ca*cy, cb*sy, 0, 
                ca*sb*cy+sa*sy, sa*sb*cy-ca*sy, cb*cy, 0,
                0, 0, 0, 1
            );
        }

        mat4 makeTranslation(vec4 pos)
        {
            // return mat4(
            //     1,0,0,pos.x,
            //     0,1,0,pos.y,
            //     0,0,1,pos.z,
            //     0,0,0,1
            // );
            return mat4(
                1,0,0,0,
                0,1,0,0,
                0,0,1,0,
                pos.x,pos.y,pos.z,1
            );
        }

        mat4 makeScale(vec4 scale)
        {
            return mat4(
                scale.x,0,0,0,
                0,scale.y,0,0,
                0,0,scale.z,0,
                0,0,0,1
            );
        }`;
        
        let vsSource = `

        attribute vec4 aVertexPosition;
        attribute vec4 aNormalVector;
        attribute vec4 aColor;
        
        // uniform vec4 uObjectPositionVector;
        // uniform vec4 uObjectRotationVector;
        // uniform vec4 uObjectScaleVector;

        uniform mat4 uObjectRotationMatrix;
        uniform mat4 uObjectMatrix;

        uniform mat4 uProjectionMatrix;
        uniform mat4 uViewMatrix;
        uniform vec4 uLightDirectionVector;
        uniform float uAmbientLightLevel;
        uniform vec4 uColorMultiplier;

        varying highp vec4 color;
        varying highp vec4 pos;
        varying highp vec3 surfaceNormal;

        void main() {

            // mat4 uObjectRotationMatrix = makeRotation( uObjectRotationVector );
            // mat4 uObjectMatrix = makeTranslation( uObjectPositionVector ) * uObjectRotationMatrix * makeScale( uObjectScaleVector );

            vec4 vPos = vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z, 1.0);
            pos = uObjectMatrix * vPos;
            gl_Position = uProjectionMatrix * uViewMatrix * pos;

            surfaceNormal = (uObjectRotationMatrix * aNormalVector).xyz;
            float d = dot(surfaceNormal, uLightDirectionVector.xyz);

            float scalar = d*(1.0-uAmbientLightLevel) + uAmbientLightLevel;
            color = aColor * scalar;
            color.w = aColor.w;
            color *= uColorMultiplier;
        }`;
    
        const fsSource = `
        precision mediump float;
        varying vec4 color;
        varying vec4 pos;
        varying vec3 surfaceNormal;
        uniform highp vec4 uLightDirectionVector;
        uniform vec4 uCameraPositionVector;
        uniform float uObjectReflectivity;

        void main() {
            // gl_FragColor = color;
            // return;

            vec3 ray = reflect( normalize(pos.xyz - uCameraPositionVector.xyz), surfaceNormal);
            float d = dot(uLightDirectionVector.xyz, ray);
            if (d < 0.0) { 
                gl_FragColor = color;
            } else { 
                d = (d*d*d*d)*uObjectReflectivity; 
                gl_FragColor = color + d*vec4(0.9,0.9,0.9,0.9);
            }
        }
        `;
        const vertexShader = this.__loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.__loadShader(this.gl.FRAGMENT_SHADER, fsSource);

        // Create the shader program
        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexLocation: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                normalLocation: this.gl.getAttribLocation(shaderProgram, 'aNormalVector'),
                colorLocation: this.gl.getAttribLocation(shaderProgram, 'aColor'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                viewMatrix: this.gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
                lightDirectionVector: this.gl.getUniformLocation(shaderProgram, 'uLightDirectionVector'),
                ambientLightLevelFloat: this.gl.getUniformLocation(shaderProgram, 'uAmbientLightLevel'),
                cameraPositionVector: this.gl.getUniformLocation(shaderProgram, 'uCameraPositionVector'),

                objectMatrix: this.gl.getUniformLocation(shaderProgram, 'uObjectMatrix'),
                objectRotationMatrix: this.gl.getUniformLocation(shaderProgram, 'uObjectRotationMatrix'),
                // objectRotationVector: this.gl.getUniformLocation(shaderProgram, 'uObjectRotationVector'),
                // objectPositionVector: this.gl.getUniformLocation(shaderProgram, 'uObjectPostionVector'),
                // objectScaleVector: this.gl.getUniformLocation(shaderProgram, 'uObjectScaleVector'),

                objectReflectivity: this.gl.getUniformLocation(shaderProgram, 'uObjectReflectivity'),
                colorMultiplier: this.gl.getUniformLocation(shaderProgram, 'uColorMultiplier')
            },
        };

        this.shaderProgram = shaderProgram;
        this.programInfo = programInfo;
    }
    clear(clearColor = new vec4(1,1,1,1), clearDepth = 1, renderReverseFaces = false) //Clear the screen to default color
    {
        // Clear the canvas before we start drawing on it.
        this.gl.clearColor(clearColor.x, clearColor.y, clearColor.z, clearColor.a);
        this.gl.clearDepth(clearDepth);                   // Clear everything

        //Enable depth testing & blending
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.enable(this.gl.BLEND);
        this.gl.depthMask(true);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        if (renderReverseFaces === true) { 
            this.gl.disable(this.gl.CULL_FACE);
        } else {                                
            this.gl.enable(this.gl.CULL_FACE); 
        }
        
        //Clearing color and depth buffer
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
        //Set Viewport
        this.gl.viewport(0, 0, this.htmlCanvasElement.width, this.htmlCanvasElement.height);
    }
    clearDepthBuffer(clearDepth = 1) // clears the depth buffer, thus allowing for rendering items after to be "on top" of closer elements (used for UI and such).
    {
        this.gl.clearDepth(clearDepth);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    }
    renderAllOfThese(
        projectionMatrix = new mat4(),
        viewMatrix = new mat4(),
        cameraPosition=new vec4(), 
        lightingDirection = new vec4(),
        ambientLightLevel = 0.7,
        objectsToRender = {
            id: 0,
            instances: [
                {
                    position: new vec4(), 
                    rotation: new vec4(),
                    scale: new vec4(),
                    colorMultiplier: new vec4(1,1,1,1)
                }
            ]
        }
    )
    {

        if (objectsToRender instanceof Map)
        {
            let temp = []
            for (const key of objectsToRender.keys()) {
                const objectID = key
                const instances = objectsToRender.get(key);
                if (instances.length > 0)
                {
                    temp.push({
                        id: objectID,
                        instances: instances
                    });
                }
            }
            objectsToRender = temp;
        }

        this.gl.useProgram(this.programInfo.program);

        // Set the shader uniforms
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix,    false,  projectionMatrix.getFloat32Array());
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.viewMatrix,          false,  viewMatrix.getFloat32Array());
        this.gl.uniform4fv(this.programInfo.uniformLocations.cameraPositionVector,              cameraPosition.getFloat32Array());
        this.gl.uniform4fv(this.programInfo.uniformLocations.lightDirectionVector,              lightingDirection.getFloat32Array());
        this.gl.uniform1f(this.programInfo.uniformLocations.ambientLightLevelFloat,             ambientLightLevel);
        let objectsNotFound = [];

        for (let i in objectsToRender)
        {
            const objectID          = objectsToRender[i].id;
            const objectInstances   = objectsToRender[i].instances;

            const objectData = this.objectMap.get(objectID);
            if (objectData == null) {
                objectsNotFound.push(objectID);
                continue;
            }

            //BIND BUFFERS ///////////////////////////////////////////
            //Bind Vertices Buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.verticesBuffer);
            this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexLocation, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexLocation);
            //Bind Normals Buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.normalsBuffer);
            this.gl.vertexAttribPointer(this.programInfo.attribLocations.normalLocation, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.programInfo.attribLocations.normalLocation);
            //Bind Colors Buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.colorsBuffer);
            this.gl.vertexAttribPointer(this.programInfo.attribLocations.colorLocation, 4, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.programInfo.attribLocations.colorLocation);
            //Bind Indices
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, objectData.indicesBuffer);

            //BIND UNIFORMS////////////////////////////////////////
            for (let j=0; j<objectInstances.length; j++)
            {
                const instanceData = objectInstances[j];
                const scale = (instanceData.scale == null) ? new vec4(1,1,1,1) : instanceData.scale;
                const colorMultiplier = (instanceData.colorMultiplier == undefined) ? new vec4(1,1,1,1) : instanceData.colorMultiplier;
                const reflectivity = (instanceData.reflectivity == undefined) ? objectData.reflectivity : instanceData.reflectivity;

                const rotMat = new mat4().makeRotation(instanceData.rotation);
                const mat = new mat4().makeTranslationRotationScale(instanceData.position, instanceData.rotation, scale);

                this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.objectRotationMatrix,    false,  rotMat.getFloat32Array());
                this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.objectMatrix,            false,  mat.getFloat32Array());

                this.gl.uniform4fv(this.programInfo.uniformLocations.colorMultiplier,              colorMultiplier.getFloat32Array());

                this.gl.uniform1f(this.programInfo.uniformLocations.objectReflectivity, reflectivity);
                this.gl.drawElements(this.gl.TRIANGLES, objectData.indices.length,      this.gl.UNSIGNED_SHORT, 0);
            }
        }

        if (objectsNotFound.length > 0)
        {
            let errorString = "Error: objects not found in map: ";
            for (let i in objectsNotFound){
                errorString += "'"+objectsNotFound[i] + "', "; 
            }
            console.error(errorString);
        }
    }
    createObject(id=0, vertices=[], normals=[], colors=[], indices=[], reflectivity=0)
    {
        function convertToFloatArray_4(arr)
        {
            if (arr[0] instanceof vec4)
            {
                let temp = [];
                for (let i=0; i<arr.length; i++)
                {
                    temp.push(arr[i].x, arr[i].y, arr[i].z, arr[i].a);
                }
                return temp;
            }
            return arr;
        }
        function convertToFloatArray_3(arr)
        {
            if (arr[0] instanceof vec4)
            {
                let temp = [];
                for (let i=0; i<arr.length; i++)
                {
                    temp.push(arr[i].x, arr[i].y, arr[i].z);
                }
                return temp;
            }
            return arr;
        }

        if (vertices == null || vertices == undefined)
        {
            vertices = cubeVertices;
            normals = cubeNormals;
            indices = cubeIndices;
        }

        vertices = convertToFloatArray_3( vertices );
        normals  = convertToFloatArray_3( normals  );

        if (colors instanceof Array)
        {
            colors = convertToFloatArray_4( colors );
        } else if (colors instanceof vec4 ){
            let temp = [];
            for (let i=0; i<vertices.length/3; i++)
            {
                temp.push(colors.x, colors.y, colors.z, colors.a);
            }
            colors = temp;
        } else {
            colors = cubeColors
        }

        //initialize the buffers
        const verticesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, verticesBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        const normalsBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalsBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);

        const colorsBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorsBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);

        const indicesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);

        this.objectMap.set(id, {
            id: id,
            vertices: vertices,
            indices: indices,
            normals: normals,
            colors: colors,
            reflectivity,reflectivity,

            verticesBuffer: verticesBuffer,
            indicesBuffer: indicesBuffer, 
            colorsBuffer: colorsBuffer,
            normalsBuffer: normalsBuffer,
        });
    }
}

//Default Cube
const cubeVertices =  [
    -0.5,0.5,0.5, 0.5,0.5,0.5, 0.5,-0.5,0.5, -0.5,-0.5,0.5, //front
    -0.5,0.5,-0.5, -0.5,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5,0.5,-0.5, //back
    -0.5,0.5,0.5, -0.5,0.5,-0.5, 0.5,0.5,-0.5, 0.5,0.5,0.5, //top
    -0.5,0.5,0.5, -0.5,-0.5,0.5, -0.5,-0.5,-0.5, -0.5,0.5,-0.5, //left
    0.5,0.5,0.5, 0.5,0.5,-0.5, 0.5,-0.5,-0.5, 0.5,-0.5,0.5, //right
    -0.5,-0.5,0.5, 0.5,-0.5,0.5, 0.5,-0.5,-0.5, -0.5,-0.5,-0.5, //bottom
];
const cubeIndices = [
    0,2,1, 0,3,2, //front
    4,6,5, 4,7,6, //back
    8,10,9, 8,11,10, //top
    12,14,13, 12,15,14, //left
    16,18,17, 16,19,18, //right
    20,22,21, 20,23,22, //bottom
];
const cubeNormals = [
    0,0,1, 0,0,1, 0,0,1, 0,0,1,
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
    0,1,0, 0,1,0, 0,1,0, 0,1,0, //top
    -1,0,0, -1,0,0, -1,0,0, -1,0,0, //right
    1,0,0, 1,0,0, 1,0,0, 1,0,0, //let
    0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0, //bottom
    
];
const cubeColors = [
    0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1,
    0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1,
    0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1,
    0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1,
    0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1,
    0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1,
];


function TetheredCubes() {
    const canvasElementRef = useRef(null);
    const [gl, setGl] = useState(null);
    const [projectionMatrix, setProjectionMatrix] = useState(null);
    const [viewMatrix, setViewMatrix] = useState(null);
    const [cameraPosition, setCameraPosition] = useState(new vec4(0,0,30));
    const [updateIntervalDelayMs, setUpdateIntervalDelayMs] = useState(50);
    const [gridSize, setGridSize] = useState(10);
    const [grid, setGrid] = useState([]);
    const [grid_vel, setGridVel] = useState([]);
    const [resetGridIterator, setResetGridIterator] = useState(0);

    const [forceMultiplier, setForceMultiplier] = useState(0.1);
    const [velocityDampeningMultiplier, setVelocityDampeningMultiplier] = useState(0.99);
    const [velocityMultiplier, setVelocityMultiplier] = useState(0.2);
    const [boundingBoxMultiplier, setBoundingBoxMultiplier] = useState(1);
    const [colorMultiplier, setColorMultiplier] = useState(1);
    const [fixedColoring, setFixedColoring] = useState(false);
    const [applyForce, setApplyForce] = useState(true);
    const [zeroVelocityOnCollision, setZeroVelocityOnCollision] = useState(true);
    const [keysDown, setKeysDown] = useState({});

    useEffect(() => {

        function reset_grid()
        {
            console.log("setup")
            const grid = [];
            const grid_vel = [];
            for (let x=0; x<gridSize; x++)
            {
                let row = [];
                let row_vel = []
                for (let y=0; y<gridSize; y++)
                {
                    let col = [];
                    let col_vel = [];
                    for (let z=0; z<gridSize; z++)
                    {
                        col.push(new vec4(x-gridSize/2,y-gridSize/2,z-gridSize/2));
                        col_vel.push(new vec4());
                    }
                    row.push(col);
                    row_vel.push(col_vel);
                }
                grid.push(row);
                grid_vel.push(row_vel);
            }
            setGrid(grid);
            setGridVel(grid_vel);
        }
        if (gl == null || resetGridIterator > 0 || Number(gridSize) != grid.length)
        {
            console.log("resetting....", gl, resetGridIterator, gridSize, grid.length);
            setResetGridIterator(0);
            const canvasElement = canvasElementRef.current;
            const newGl = new SpeedyGL(canvasElement);
            newGl.createObject("cube", cubeVertices, cubeNormals, cubeColors, cubeIndices, 0.5);
            setProjectionMatrix(new mat4().makePerspective(0.7,canvasElement.width/canvasElement.height,1,100000));
            reset_grid();
            setGl(newGl);
            return;
        }

        function update()
        {
            const canvasElement = canvasElementRef.current;
            if (canvasElement == null || gl == null)
            {
                return;
            }
            let bb = canvasElement.getBoundingClientRect();
            canvasElement.width = bb.width;
            canvasElement.height = bb.height;
            gl.clear(new vec4(0,0,0,1));

            const dt_s = updateIntervalDelayMs / 50;
            const objectsToRender = new Map();
            objectsToRender.set("cube", []);
            
            let v = new vec4();
            let mag = 0;
            for (let x=0; x<gridSize; x++)
            {
                for (let y=0; y<gridSize; y++)
                {
                    for (let z=0; z<gridSize; z++)
                    {
                        let color = null;
                        if (fixedColoring)
                        {
                            // Positional Coloring
                            color = new vec4(x/gridSize,y/gridSize,z/gridSize,1);
                        } else {
                            // Velocity Coloring
                            color = grid_vel[x][y][z].mul(colorMultiplier);
                            if (color.x < 0) { color.x = -color.x; }
                            if (color.y < 0) { color.y = -color.y; }
                            if (color.z < 0) { color.z = -color.z; }
                            color.addi(1-colorMultiplier, 1-colorMultiplier, 1-colorMultiplier);
                            color.a = 1;
                        }
                        objectsToRender.get('cube').push(
                        {
                            position: grid[x][y][z], 
                            rotation: grid_vel[x][y][z],
                            scale: new vec4(0.3,0.3,0.3,1),
                            colorMultiplier: color,
                            reflectivity: 0.01
                        });

                        const pos = grid[x][y][z];
                        const vel = grid_vel[x][y][z];
                        const force = new vec4(0.005-Math.random()*0.01, 0.005-Math.random()*0.01, 0.005-Math.random()*0.01);

                        if (applyForce)
                        {
                            force.addi( pos.copy().scaleToUnit().muli(-0.1) );
                        }

                        
                        if (x > 0)
                        {
                            v = grid[x-1][y][z].sub(pos);
                            mag = 1.0 - v.getLength();
                            force.addi( v.mul(-mag) );
                        }
                        if (x < gridSize-1)
                        {
                            v = grid[x+1][y][z].sub(pos);
                            mag = 1.0 - v.getLength();
                            force.addi( v.mul(-mag) );
                        }
                        if (y > 0)
                        {
                            v = grid[x][y-1][z].sub(pos);
                            mag = 1.0 - v.getLength();
                            force.addi( v.muli(-mag) );
                        }
                        if (y < gridSize-1)
                        {
                            v = grid[x][y+1][z].sub(pos);
                            mag = 1.0 - v.getLength();
                            force.addi( v.muli(-mag) );
                        }
                        if (z > 0)
                        {
                            v = grid[x][y][z-1].sub(pos);
                            mag = 1.0 - v.getLength();
                            force.addi( v.mul(-mag) );
                        }
                        if (z < gridSize-1)
                        {
                            v = grid[x][y][z+1].sub(pos);
                            mag = 1.0 - v.getLength();
                            force.addi( v.mul(-mag) );
                        }

                        let length = force.getLength();
                        if (length > 0.5)
                        {
                            force.muli(1/length);
                        }

                        vel.muli(velocityDampeningMultiplier);
                        vel.addi(force.mul(forceMultiplier));
                        pos.addi(vel.mul(velocityMultiplier).mul(dt_s));

                        // pos.x = Math.min(gridSize*boundingBoxMultiplier, Math.max(-gridSize*boundingBoxMultiplier, pos.x));
                        // pos.y = Math.min(gridSize*boundingBoxMultiplier, Math.max(-gridSize*boundingBoxMultiplier, pos.y));
                        // pos.z = Math.min(gridSize*boundingBoxMultiplier, Math.max(-gridSize*boundingBoxMultiplier, pos.z));
                        const maxVal = gridSize*boundingBoxMultiplier;
                        if (zeroVelocityOnCollision)
                        {
                            if (pos.x > maxVal)
                            {
                                pos.x = maxVal;
                                vel.x = 0;
                            }
                            if (pos.x < -maxVal)
                            {
                                pos.x = -maxVal;
                                vel.x = 0;
                            }
                            if (pos.y > maxVal)
                            {
                                pos.y = maxVal;
                                vel.y = 0;
                            }
                            if (pos.y < -maxVal)
                            {
                                pos.y = -maxVal;
                                vel.y = 0;
                            }
                            if (pos.z > maxVal)
                            {
                                pos.z = maxVal;
                                vel.z = 0;
                            }
                            if (pos.z < -maxVal)
                            {
                                pos.z = -maxVal;
                                vel.z = 0;
                            }
                        } else {
                            if (pos.x > maxVal)
                            {
                                pos.x = maxVal;
                            }
                            if (pos.x < -maxVal)
                            {
                                pos.x = -maxVal;
                            }
                            if (pos.y > maxVal)
                            {
                                pos.y = maxVal;
                            }
                            if (pos.y < -maxVal)
                            {
                                pos.y = -maxVal;
                            }
                            if (pos.z > maxVal)
                            {
                                pos.z = maxVal;
                            }
                            if (pos.z < -maxVal)
                            {
                                pos.z = -maxVal;
                            }
                        }
                    }
                }
            }

            const newProjectionMatrix = new mat4().makePerspective(0.7,canvasElement.width/canvasElement.height,1,1000);
            const newViewMatrix = new mat4().makeTranslation(cameraPosition.mul(-1));
            setProjectionMatrix(newProjectionMatrix);
            setViewMatrix(newViewMatrix);
            
            gl.renderAllOfThese(newProjectionMatrix, newViewMatrix, cameraPosition, new vec4(0.6,0.6,0.6), 0.3, objectsToRender);

            // Update camera position
            if (keysDown['w'])
            {
                setCameraPosition(cameraPosition.add(new vec4(0,0,-0.5)));
            }
            if (keysDown['s'])
            {
                setCameraPosition(cameraPosition.add(new vec4(0,0,0.5)));
            }
            if (keysDown['a'])
            {
                setCameraPosition(cameraPosition.add(new vec4(-0.5,0,0)));
            }
            if (keysDown['d'])
            {
                setCameraPosition(cameraPosition.add(new vec4(0.5,0,0)));
            }
        }
        
        let updateInterval = setInterval(update, updateIntervalDelayMs);
        function keyDownListener(e)
        {
            if (e.key === 'w')
            {
                keysDown['w'] = e.type === 'keydown';
            }
            if (e.key === 's')
            {
                keysDown['s'] = e.type === 'keydown';
            }
            if (e.key === 'a')
            {
                keysDown['a'] = e.type === 'keydown';
            }
            if (e.key === 'd')
            {
                keysDown['d'] = e.type === 'keydown';
            }
            setKeysDown(keysDown);
        }
        function keyUpListener(e)
        {
            keysDown[e.key] = false;
        }
        window.addEventListener('keydown', keyDownListener);
        window.addEventListener('keyup', keyUpListener);
        return () => {
            clearInterval(updateInterval);
            window.removeEventListener('keydown', keyDownListener);
            window.removeEventListener('keyup', keyUpListener);
        }
    }, [updateIntervalDelayMs, gridSize, grid, grid_vel, resetGridIterator, cameraPosition, projectionMatrix, viewMatrix, gl, forceMultiplier, velocityDampeningMultiplier, velocityMultiplier, boundingBoxMultiplier, colorMultiplier, fixedColoring, applyForce, zeroVelocityOnCollision, keysDown]);

    return (
        <div className="project-page">
            <div style={{'textAlign': 'center'}}>
                <h1>Tethered Cubes</h1>
            </div>

            <div style={{'padding': '1vh 5vw 1vh 5vw'}}>
                This project started as a soft body simulator, and quickly diverged from desired.
                I started with a 3d grid of cubes. Each cube is tethered to six other cubes: above, below, left, right, front, and back.
                Each tether acts as a spring, and applies forces to both cubes it's between.
                As these tethers do not care about the angle between the cubes (only distance), the structure quickly falls apart. 
                When you tune the force multiplier, velocity dampening, and velocity multiplier just right, you get this interesting simulation.
                The coloring of each cube represents it's current velocity.

            </div>

            <div style={{display: 'block', position: 'relative', minHeight: 'fit-content', width: '99vw', height: '89vh', marginLeft: 'auto', marginRight: 'auto'}}>
                <canvas id="mainCanvas" ref={canvasElementRef} style={{display: 'block', position: 'absolute', top: '0', left: '0', width: '100%', height: '100%'}}></canvas>
                <div id="canvasOverlay" style={{display: 'block', position: 'absolute', top: '0', left: '0', width: '100%', height: '100%'}}>
                    <table style={{'backgroundColor': 'rgba(255,255,255,0.1)', 'borderRadius': '0.4rem', 'margin': '1rem', 'padding': '0.2rem', 'color': 'rgb(150,150,150)'}} > 
                        <tbody>
                            <tr>
                                <td>Force Multiplier</td>
                                <td><input id="forceMultiplierInput" type="range" min="0" max="1" step="0.01" defaultValue="0.1" onChange={(e) => {setForceMultiplier(e.target.value)}}/></td>
                            </tr>
                            <tr>
                                <td>Velocity Dampening Multiplier</td>
                                <td><input id="velocityDampeningMultiplierInput" type="range" min="0.8" max="1" step="0.01" defaultValue="0.99" onChange={(e) => {setVelocityDampeningMultiplier(e.target.value)}}/></td>
                            </tr>
                            <tr>
                                <td>Velocity Multiplier</td>
                                <td><input id="velocityMultiplierInput" type="range" min="0" max="1" step="0.01" defaultValue="0.2" onChange={(e) => {setVelocityMultiplier(e.target.value)}}/></td>
                            </tr>
                            <tr>
                                <td>Fixed Coloring</td>
                                <td><input id="fixedColoringInput" type="checkbox" onChange={(e) => {setFixedColoring(e.target.checked)}}/></td>
                            </tr>
                            <tr>
                                <td>Apply Attractive Force</td>
                                <td><input id="applyForceInput" type="checkbox" onChange={(e) => {setApplyForce(e.target.checked)}}/></td>
                            </tr>
                            <tr>
                                <td>Color Multiplier</td>
                                <td><input id="colorMultiplierInput" type="range" min="0" max="1" step="0.01" defaultValue="0.9" onChange={(e) => {setColorMultiplier(e.target.value)}}/></td>
                            </tr>
                            <tr>
                                <td>Grid Size</td>
                                <td><input id="gridSizeInput" type="range" min="3" max="30" step="1" defaultValue="10" onChange={(e) => {setGridSize(e.target.value)}}/></td>
                            </tr>
                            <tr>
                                <td>Bounding Box Size</td>
                                <td><input id="boundingBoxMultiplierInput" type="range" min="0" max="3" step="0.1" defaultValue="1.2" onChange={(e) => {setBoundingBoxMultiplier(e.target.value)}}/></td>
                            </tr>
                            <tr>
                                <td>Zero velocity on bounding box collision</td>
                                <td><input id="zeroVelocityOnCollisionInput" type="checkbox"/></td>
                            </tr>
                            <tr>
                                <td>Frame rate</td>
                                <td><input id="framerateInput" type="range" min="5" max="60" step="5" defaultValue="25" onChange={(e) => {setUpdateIntervalDelayMs(1000 / e.target.value)}}/></td>
                            </tr>
                            <tr>
                                <td colSpan={2}>Note: Use WASD to move the camera</td>
                            </tr>
                            
                            <tr>
                                <td colSpan={2}> 
                                    <button onClick={() => {setResetGridIterator(resetGridIterator + 1)}} style={{'backgroundColor': 'rgb(100,100,100)', 'borderRadius': '0.3rem', 'width': '100%', 'padding': '0.2rem'}}>
                                        Reset
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default TetheredCubes;