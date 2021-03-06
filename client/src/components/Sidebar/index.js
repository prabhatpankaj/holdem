import React, { useState } from 'react';
import {
  Avatar,
  Chip,
  Drawer,
  FormControl,
  Input,
  InputLabel,
} from '@material-ui/core';
import { useRouteMatch } from 'react-router-dom';
import avatars from '../../data/avatars';
import { useUser } from '../../state';
import AvatarPicker from '../AvatarPicker';
import Button from '../Button';
import styles from './index.module.css';

function Sidebar() {
  const requireData = useRouteMatch('/room');
  const [data, setData] = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const [newName, setNewName] = useState(null);
  const [newAvatar, setNewAvatar] = useState(null);

  const storedName = data.name || null;
  const storedAvatar = data.avatarId || null;

  const name = (
    newName === null
      ? storedName
      : newName
  );

  const avatar = (
    newAvatar === null
      ? storedAvatar
      : newAvatar
  );

  const isStored = storedName !== null && storedAvatar !== null;
  const isValid = name && avatar !== null;

  const onNameChange = ({ target: { value } }) => setNewName(value);
  const onAvatarChange = (value) => setNewAvatar(value);

  const onSubmit = () => {
    setData({
      name,
      avatarId: avatar,
    });

    setIsOpen(false);
  };

  return (
    <div className={styles.container}>
      {
        isStored
          ? (
            <Chip
              className={styles.iconContainer}
              onClick={() => setIsOpen(true)}
              label={storedName}
              avatar={(
                <Avatar
                  src={
                    avatars.find(
                      ({ id }) => id === storedAvatar,
                    ).image
                  }
                />
              )}
            />
          )
          : null
      }
      <Drawer
        anchor="right"
        open={isOpen || (requireData && !isStored)}
        onClose={() => setIsOpen(false)}
      >
        <div className={styles.sidebar}>
          <h2 className={styles.header}>My Profile</h2>
          <FormControl className={styles.form}>
            <div className={styles.inputContainer}>
              <InputLabel htmlFor="my-input">Name</InputLabel>
              <Input
                id="name"
                placeholder="E.g. Air Bud"
                className={styles.input}
                value={name || ''}
                onChange={onNameChange}
              />
            </div>
            <AvatarPicker
              value={avatar}
              onChange={onAvatarChange}
            />
            <Button
              className={styles.submit}
              size="large"
              disabled={!isValid}
              onClick={onSubmit}
            >
              Update
            </Button>
          </FormControl>
        </div>
      </Drawer>
    </div>
  );
}

export default Sidebar;
